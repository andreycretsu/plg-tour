import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';
import { CreateTourRequest } from '@/lib/types';

export const dynamic = 'force-dynamic';

// GET /api/tours - List all tours for workspace
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

    // Get workspace_id from JWT or from user's membership
    let workspaceId = payload.workspaceId;
    
    if (!workspaceId) {
      // Fallback: get first workspace the user belongs to
      const memberResult = await query(
        `SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1`,
        [payload.userId]
      );
      if (memberResult.rows.length > 0) {
        workspaceId = memberResult.rows[0].workspace_id;
      }
    }

    // Query tours - support both workspace_id and legacy user_id
    const result = await query(
      `SELECT id, user_id, workspace_id, name, url_pattern, is_active, created_at, updated_at
       FROM tours 
       WHERE workspace_id = $1 OR (workspace_id IS NULL AND user_id = $2)
       ORDER BY created_at DESC`,
      [workspaceId, payload.userId]
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

    // Get workspace_id from JWT or from user's membership
    let workspaceId = payload.workspaceId;
    
    if (!workspaceId) {
      // Fallback: get first workspace the user belongs to
      const memberResult = await query(
        `SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1`,
        [payload.userId]
      );
      if (memberResult.rows.length > 0) {
        workspaceId = memberResult.rows[0].workspace_id;
      }
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

    // Create tour with workspace_id
    const tourResult = await query(
      `INSERT INTO tours (user_id, workspace_id, name, url_pattern) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, user_id, workspace_id, name, url_pattern, is_active, created_at, updated_at`,
      [payload.userId, workspaceId, name, urlPattern]
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
