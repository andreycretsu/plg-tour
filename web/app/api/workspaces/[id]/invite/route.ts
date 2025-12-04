import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// POST /api/workspaces/[id]/invite - Invite a user to workspace
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try cookie first, then Authorization header
    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = request.headers.get('authorization');
    const headerToken = extractToken(authHeader);
    const token = cookieToken || headerToken;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const workspaceId = parseInt(params.id);
    const body = await request.json();
    const { email, role = 'member' } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if current user is owner or admin of this workspace
    const membershipResult = await query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, payload.userId]
    );

    if (membershipResult.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const currentUserRole = membershipResult.rows[0].role;
    if (currentUserRole !== 'owner' && currentUserRole !== 'admin') {
      return NextResponse.json({ error: 'Only owners and admins can invite members' }, { status: 403 });
    }

    // Check if user with this email already exists
    const existingUserResult = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUserResult.rows.length > 0) {
      const existingUserId = existingUserResult.rows[0].id;
      
      // Check if already a member
      const existingMemberResult = await query(
        'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
        [workspaceId, existingUserId]
      );

      if (existingMemberResult.rows.length > 0) {
        return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 409 });
      }

      // Add user directly to workspace (since they already have an account)
      await query(
        `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)`,
        [workspaceId, existingUserId, role]
      );

      return NextResponse.json({ 
        message: 'User added to workspace',
        added: true
      });
    }

    // Generate invite token for new user
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Check if invite already exists
    const existingInviteResult = await query(
      'SELECT id FROM workspace_invites WHERE workspace_id = $1 AND email = $2 AND expires_at > NOW()',
      [workspaceId, email]
    );

    if (existingInviteResult.rows.length > 0) {
      // Update existing invite
      await query(
        `UPDATE workspace_invites 
         SET invite_token = $1, role = $2, expires_at = $3, created_at = NOW()
         WHERE workspace_id = $4 AND email = $5`,
        [inviteToken, role, expiresAt, workspaceId, email]
      );
    } else {
      // Create new invite
      await query(
        `INSERT INTO workspace_invites (workspace_id, email, role, invite_token, expires_at) 
         VALUES ($1, $2, $3, $4, $5)`,
        [workspaceId, email, role, inviteToken, expiresAt]
      );
    }

    // In a real app, you would send an email here with the invite link
    // For MVP, we'll just return success
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://plg-tour.vercel.app'}/invite/${inviteToken}`;

    return NextResponse.json({ 
      message: 'Invite sent',
      inviteUrl, // In production, don't expose this - send via email
    });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

