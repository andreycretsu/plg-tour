import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';
import { CreateTourRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET /api/tours - List all tours for user
export async function GET(request: NextRequest) {
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

    const result = await query(
      `SELECT id, user_id, name, url_pattern, is_active, created_at, updated_at
       FROM tours 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [payload.userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get tours error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tours - Create new tour
export async function POST(request: NextRequest) {
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

    const body: CreateTourRequest = await request.json();
    const { name, urlPattern, steps } = body;

    // Validation
    if (!name || !urlPattern) {
      return NextResponse.json(
        { error: 'Name and URL pattern are required' },
        { status: 400 }
      );
    }

    // Create tour
    const tourResult = await query(
      `INSERT INTO tours (user_id, name, url_pattern) 
       VALUES ($1, $2, $3) 
       RETURNING id, user_id, name, url_pattern, is_active, created_at, updated_at`,
      [payload.userId, name, urlPattern]
    );

    const tour = tourResult.rows[0];

    // Create steps if provided
    if (steps && steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await query(
          `INSERT INTO tour_steps 
           (tour_id, step_order, selector, title, content, image_url, button_text, placement, pulse_enabled, z_index) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            tour.id,
            i,
            step.selector,
            step.title,
            step.content,
            step.imageUrl || null,
            step.buttonText,
            step.placement,
            step.pulseEnabled,
            step.zIndex || 2147483647,
          ]
        );
      }
    }

    return NextResponse.json(tour, { status: 201 });
  } catch (error) {
    console.error('Create tour error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

