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

    // Check if it's an API token (starts with tl_)
    if (token.startsWith('tl_')) {
      // Look up user by API token
      const result = await query(
        `SELECT id, email, name, api_token, created_at 
         FROM users WHERE api_token = $1`,
        [token]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid API token' },
          { status: 401 }
        );
      }

      user = result.rows[0];
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
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        apiToken: user.api_token,
        createdAt: user.created_at,
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
