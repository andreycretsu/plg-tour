import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/tours/[id]/duplicate - Duplicate a tour with all steps
export async function POST(
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

    const tourId = parseInt(params.id);

    // Get original tour
    const originalTour = await query(
      `SELECT * FROM tours WHERE id = $1 AND user_id = $2`,
      [tourId, payload.userId]
    );

    if (originalTour.rows.length === 0) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const tour = originalTour.rows[0];

    // Create duplicate tour with is_active = false and "Copy of" prefix
    const newTour = await query(
      `INSERT INTO tours (user_id, workspace_id, name, url_pattern, is_active)
       VALUES ($1, $2, $3, $4, false)
       RETURNING *`,
      [
        payload.userId,
        tour.workspace_id,
        `Copy of ${tour.name}`,
        tour.url_pattern
      ]
    );

    const duplicatedTour = newTour.rows[0];

    // Get original steps
    const originalSteps = await query(
      `SELECT * FROM tour_steps WHERE tour_id = $1 ORDER BY step_order`,
      [tourId]
    );

    // Duplicate all steps
    for (const step of originalSteps.rows) {
      await query(
        `INSERT INTO tour_steps (
          tour_id, step_order, selector, title, content,
          image_url, button_text, placement, pulse_enabled
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          duplicatedTour.id,
          step.step_order,
          step.selector,
          step.title,
          step.content,
          step.image_url,
          step.button_text,
          step.placement,
          step.pulse_enabled
        ]
      );
    }

    // Get the new steps
    const newSteps = await query(
      `SELECT * FROM tour_steps WHERE tour_id = $1 ORDER BY step_order`,
      [duplicatedTour.id]
    );

    return NextResponse.json({
      tour: {
        ...duplicatedTour,
        steps: newSteps.rows
      }
    });
  } catch (error) {
    console.error('Duplicate tour error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

