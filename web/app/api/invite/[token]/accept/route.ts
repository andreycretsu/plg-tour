import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, generateToken, generateApiToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/invite/[token]/accept - Accept invite
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const body = await request.json();
    const { name, password } = body;

    // Get invite details
    const inviteResult = await query(
      `SELECT wi.id, wi.workspace_id, wi.email, wi.role, wi.expires_at,
              w.name as workspace_name, w.slug as workspace_slug, w.api_token as workspace_api_token
       FROM workspace_invites wi
       JOIN workspaces w ON wi.workspace_id = w.id
       WHERE wi.invite_token = $1 AND wi.expires_at > NOW()`,
      [token]
    );

    if (inviteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 });
    }

    const invite = inviteResult.rows[0];

    // Check if user already exists
    const existingUserResult = await query(
      'SELECT id, email, name, api_token, created_at FROM users WHERE email = $1',
      [invite.email]
    );

    let user;
    let isNewUser = false;

    if (existingUserResult.rows.length > 0) {
      // Existing user
      user = existingUserResult.rows[0];
    } else {
      // New user - need name and password
      if (!name || !password) {
        return NextResponse.json({ 
          error: 'Name and password are required for new users' 
        }, { status: 400 });
      }

      // Create new user
      const passwordHash = await hashPassword(password);
      const apiToken = generateApiToken();

      const newUserResult = await query(
        `INSERT INTO users (email, password_hash, name, api_token) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id, email, name, api_token, created_at`,
        [invite.email, passwordHash, name, apiToken]
      );

      user = newUserResult.rows[0];
      isNewUser = true;
    }

    // Check if already a member
    const existingMemberResult = await query(
      'SELECT id FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [invite.workspace_id, user.id]
    );

    if (existingMemberResult.rows.length === 0) {
      // Add user to workspace
      await query(
        `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)`,
        [invite.workspace_id, user.id, invite.role]
      );
    }

    // Delete the invite (it's been used)
    await query(
      'DELETE FROM workspace_invites WHERE id = $1',
      [invite.id]
    );

    // Generate JWT
    const jwtToken = generateToken({ 
      userId: user.id, 
      email: user.email,
      workspaceId: invite.workspace_id
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        apiToken: user.api_token,
        createdAt: user.created_at,
      },
      workspace: {
        id: invite.workspace_id,
        name: invite.workspace_name,
        slug: invite.workspace_slug,
        apiToken: invite.workspace_api_token,
        role: invite.role,
      },
      token: jwtToken,
      isNewUser,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

