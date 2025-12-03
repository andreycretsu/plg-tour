import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/invite/[token] - Get invite info
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Get invite details
    const inviteResult = await query(
      `SELECT wi.id, wi.workspace_id, wi.email, wi.role, wi.expires_at,
              w.name as workspace_name, w.slug as workspace_slug
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
    const userResult = await query(
      'SELECT id, name FROM users WHERE email = $1',
      [invite.email]
    );

    const existingUser = userResult.rows.length > 0 ? userResult.rows[0] : null;

    return NextResponse.json({
      workspaceName: invite.workspace_name,
      workspaceSlug: invite.workspace_slug,
      email: invite.email,
      role: invite.role,
      existingUser: existingUser ? { id: existingUser.id, name: existingUser.name } : null,
    });
  } catch (error) {
    console.error('Get invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

