import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Missing authorization token' },
        { status: 401 }
      );
    }

    let user;
    let workspace;

    // Check if it's an API token (starts with tl_ or t1_) vs JWT (has dots)
    const isApiToken = token.startsWith('tl_') || token.startsWith('t1_') || !token.includes('.');
    
    if (isApiToken && !token.includes('.')) {
      // First try to find workspace by API token
      const workspaceResult = await query(
        `SELECT w.id, w.name, w.slug, w.api_token 
         FROM workspaces w WHERE w.api_token = $1`,
        [token]
      );

      if (workspaceResult.rows.length > 0) {
        // Found workspace - get the owner
        workspace = workspaceResult.rows[0];
        
        const ownerResult = await query(
          `SELECT u.id, u.email, u.name, u.api_token, u.created_at 
           FROM users u
           JOIN workspace_members wm ON u.id = wm.user_id
           WHERE wm.workspace_id = $1 AND wm.role = 'owner'
           LIMIT 1`,
          [workspace.id]
        );

        if (ownerResult.rows.length > 0) {
          user = ownerResult.rows[0];
        } else {
          // No owner? Get any member
          const memberResult = await query(
            `SELECT u.id, u.email, u.name, u.api_token, u.created_at 
             FROM users u
             JOIN workspace_members wm ON u.id = wm.user_id
             WHERE wm.workspace_id = $1
             LIMIT 1`,
            [workspace.id]
          );
          if (memberResult.rows.length > 0) {
            user = memberResult.rows[0];
          }
        }
      } else {
        // Try user API token
        const userResult = await query(
          `SELECT id, email, name, api_token, created_at 
           FROM users WHERE api_token = $1`,
          [token]
        );

        if (userResult.rows.length > 0) {
          user = userResult.rows[0];
          
          // Get user's workspace
          const workspaceMemberResult = await query(
            `SELECT w.id, w.name, w.slug, w.api_token 
             FROM workspaces w
             JOIN workspace_members wm ON w.id = wm.workspace_id
             WHERE wm.user_id = $1
             LIMIT 1`,
            [user.id]
          );
          
          if (workspaceMemberResult.rows.length > 0) {
            workspace = workspaceMemberResult.rows[0];
          }
        }
      }

      if (!user) {
        return NextResponse.json(
          { error: 'Invalid API token' },
          { status: 401 }
        );
      }
    } else {
      // It's a JWT token - verify it
      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        );
      }

      // Get user by ID from JWT
      const result = await query(
        `SELECT id, email, name, api_token, created_at 
         FROM users WHERE id = $1`,
        [payload.userId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      user = result.rows[0];
      
      // Get workspace from JWT or lookup
      if (payload.workspaceId) {
        const wsResult = await query(
          `SELECT id, name, slug, api_token FROM workspaces WHERE id = $1`,
          [payload.workspaceId]
        );
        if (wsResult.rows.length > 0) {
          workspace = wsResult.rows[0];
        }
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        apiToken: user.api_token,
        createdAt: user.created_at,
      },
      workspace: workspace ? {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        apiToken: workspace.api_token,
      } : null,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
