import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyPassword, generateToken, generateApiToken } from '@/lib/auth';
import { LoginRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

// Generate a URL-friendly slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) + '-' + Math.random().toString(36).slice(2, 8);
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing email or password' },
        { status: 400 }
      );
    }

    // Find user
    const userResult = await query(
      `SELECT id, email, name, password_hash, api_token, created_at 
       FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Get user's workspaces
    const workspacesResult = await query(
      `SELECT w.id, w.name, w.slug, w.api_token, w.created_at, wm.role
       FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = $1
       ORDER BY w.created_at ASC`,
      [user.id]
    );

    let workspace = workspacesResult.rows[0];

    // If user has no workspace (legacy user), create one for them
    if (!workspace) {
      const workspaceName = `${user.name}'s Workspace`;
      const workspaceSlug = generateSlug(workspaceName);
      const workspaceApiToken = generateApiToken();

      const newWorkspaceResult = await query(
        `INSERT INTO workspaces (name, slug, api_token) 
         VALUES ($1, $2, $3) 
         RETURNING id, name, slug, api_token, created_at`,
        [workspaceName, workspaceSlug, workspaceApiToken]
      );

      workspace = newWorkspaceResult.rows[0];
      workspace.role = 'owner';

      // Add user as workspace owner
      await query(
        `INSERT INTO workspace_members (workspace_id, user_id, role) 
         VALUES ($1, $2, $3)`,
        [workspace.id, user.id, 'owner']
      );

      // Migrate user's existing tours to this workspace
      await query(
        `UPDATE tours SET workspace_id = $1 WHERE user_id = $2`,
        [workspace.id, user.id]
      );
    }

    // Generate JWT with workspace info
    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      workspaceId: workspace.id
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
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        apiToken: workspace.api_token,
        role: workspace.role,
        createdAt: workspace.created_at,
      },
      workspaces: workspacesResult.rows.map(w => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        role: w.role,
      })),
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
