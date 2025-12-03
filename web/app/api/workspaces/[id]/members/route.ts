import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/workspaces/[id]/members - List workspace members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const workspaceId = parseInt(params.id);

    // Check if user is a member of this workspace
    const membershipResult = await query(
      'SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2',
      [workspaceId, payload.userId]
    );

    if (membershipResult.rows.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get all members
    const membersResult = await query(
      `SELECT wm.id, wm.user_id, u.name, u.email, wm.role, wm.joined_at
       FROM workspace_members wm
       JOIN users u ON wm.user_id = u.id
       WHERE wm.workspace_id = $1
       ORDER BY 
         CASE wm.role 
           WHEN 'owner' THEN 1 
           WHEN 'admin' THEN 2 
           ELSE 3 
         END,
         wm.joined_at ASC`,
      [workspaceId]
    );

    const members = membersResult.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      email: row.email,
      role: row.role,
      joinedAt: row.joined_at,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Get workspace members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

