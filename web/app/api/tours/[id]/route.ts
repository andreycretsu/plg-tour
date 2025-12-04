import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/tours/:id - Get single tour with steps
export async function GET(
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

    // Get tour
    const tourResult = await query(
      `SELECT id, user_id, name, url_pattern, is_active, created_at, updated_at
       FROM tours 
       WHERE id = $1 AND user_id = $2`,
      [params.id, payload.userId]
    );

    if (tourResult.rows.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tour = tourResult.rows[0];

    // Get steps
    const stepsResult = await query(
      `SELECT id, tour_id, step_order, selector, title, content, 
              image_url, button_text, placement, pulse_enabled
       FROM tour_steps 
       WHERE tour_id = $1 
       ORDER BY step_order ASC`,
      [params.id]
    );

    return NextResponse.json({
      tour: {
        ...tour,
        steps: stepsResult.rows,
      }
    });
  } catch (error) {
    console.error('Get tour error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tours/:id - Delete tour
export async function DELETE(
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

    // Delete tour (steps will be cascade deleted)
    const result = await query(
      'DELETE FROM tours WHERE id = $1 AND user_id = $2 RETURNING id',
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tour error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tours/:id - Full update tour with steps
export async function PUT(
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

    const body = await request.json();
    const { name, urlPattern, isActive, steps } = body;

    // Verify tour ownership
    const checkResult = await query(
      'SELECT id FROM tours WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    // Update tour
    const tourResult = await query(
      `UPDATE tours 
       SET name = $1,
           url_pattern = $2,
           is_active = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, name, url_pattern, is_active, created_at, updated_at`,
      [name, urlPattern, isActive !== false, params.id, payload.userId]
    );

    const tour = tourResult.rows[0];

    // Update steps - delete all existing and recreate
    if (steps && Array.isArray(steps)) {
      // Delete existing steps
      await query('DELETE FROM tour_steps WHERE tour_id = $1', [params.id]);

      // Insert new steps
      for (const step of steps) {
        await query(
          `INSERT INTO tour_steps (
            tour_id, step_order, selector, title, content, 
            image_url, button_text, placement, pulse_enabled
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            params.id,
            step.stepOrder,
            step.selector,
            step.title,
            step.content,
            step.imageUrl || null,
            step.buttonText || 'Next',
            step.placement || 'bottom',
            step.pulseEnabled !== false,
          ]
        );
      }
    }

    // Get updated steps
    const stepsResult = await query(
      `SELECT id, tour_id, step_order, selector, title, content, 
              image_url, button_text, placement, pulse_enabled
       FROM tour_steps 
       WHERE tour_id = $1 
       ORDER BY step_order ASC`,
      [params.id]
    );

    return NextResponse.json({
      tour: {
        ...tour,
        steps: stepsResult.rows,
      }
    });
  } catch (error) {
    console.error('Update tour error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/tours/:id - Partial update tour
export async function PATCH(
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

    const body = await request.json();
    const { name, urlPattern, isActive } = body;

    const result = await query(
      `UPDATE tours 
       SET name = COALESCE($1, name),
           url_pattern = COALESCE($2, url_pattern),
           is_active = COALESCE($3, is_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND user_id = $5
       RETURNING id, user_id, name, url_pattern, is_active, created_at, updated_at`,
      [name, urlPattern, isActive, params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return NextResponse.json({ tour: result.rows[0] });
  } catch (error) {
    console.error('Update tour error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
