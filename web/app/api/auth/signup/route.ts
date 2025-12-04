import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, generateToken, generateApiToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Generate a URL-friendly slug from company name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50) + '-' + Math.random().toString(36).slice(2, 8);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, company } = body;

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // Hash password and generate tokens
    const passwordHash = await hashPassword(password);
    const userApiToken = generateApiToken(); // For backwards compatibility
    const workspaceApiToken = generateApiToken(); // For workspace

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password_hash, name, api_token) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, api_token, created_at`,
      [email, passwordHash, name, userApiToken]
    );

    const user = userResult.rows[0];

    // Create workspace
    const workspaceName = company || `${name}'s Workspace`;
    const workspaceSlug = generateSlug(workspaceName);

    const workspaceResult = await query(
      `INSERT INTO workspaces (name, slug, api_token) 
       VALUES ($1, $2, $3) 
       RETURNING id, name, slug, api_token, created_at`,
      [workspaceName, workspaceSlug, workspaceApiToken]
    );

    const workspace = workspaceResult.rows[0];

    // Add user as workspace owner
    await query(
      `INSERT INTO workspace_members (workspace_id, user_id, role) 
       VALUES ($1, $2, $3)`,
      [workspace.id, user.id, 'owner']
    );

    // Generate JWT with workspace info
    const token = generateToken({ 
      userId: user.id, 
      email: user.email,
      workspaceId: workspace.id 
    });

    // Create response with user data (no sensitive tokens in body)
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.created_at,
      },
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: 'owner',
        createdAt: workspace.created_at,
      },
    });

    // Set JWT as HttpOnly cookie (secure, not accessible via JS)
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
