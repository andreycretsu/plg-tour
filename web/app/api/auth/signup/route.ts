import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { hashPassword, generateToken, generateApiToken } from '@/lib/auth';
import { SignupRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { email, password, name } = body;

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

    // Hash password and generate API token
    const passwordHash = await hashPassword(password);
    const apiToken = generateApiToken();

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, name, api_token) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, api_token, created_at`,
      [email, passwordHash, name, apiToken]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = generateToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        apiToken: user.api_token,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

