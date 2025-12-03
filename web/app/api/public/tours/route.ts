import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUBLIC ENDPOINT: GET tours by API token (for extension)
export async function GET(request: NextRequest) {
  try {
    const apiToken = request.headers.get('x-api-token');

    if (!apiToken) {
      return NextResponse.json({ error: 'Missing API token' }, { status: 401 });
    }

    // Verify API token and get user
    const userResult = await query(
      'SELECT id FROM users WHERE api_token = $1',
      [apiToken]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid API token' }, { status: 401 });
    }

    const userId = userResult.rows[0].id;
    const url = request.nextUrl.searchParams.get('url');

    // Get active tours for this user
    let toursQuery = `
      SELECT t.id, t.name, t.url_pattern, t.is_active
      FROM tours t
      WHERE t.user_id = $1 AND t.is_active = true
    `;
    
    const params: any[] = [userId];

    // If URL provided, filter by pattern
    if (url) {
      toursQuery += ' AND $2 ~ t.url_pattern';
      params.push(url);
    }

    const toursResult = await query(toursQuery, params);
    const tours = toursResult.rows;

    // Get steps for each tour
    for (const tour of tours) {
      const stepsResult = await query(
        `SELECT id, step_order, selector, title, content, 
                image_url, button_text, placement, pulse_enabled
         FROM tour_steps 
         WHERE tour_id = $1 
         ORDER BY step_order ASC`,
        [tour.id]
      );
      tour.steps = stepsResult.rows;
    }

    return NextResponse.json(tours);
  } catch (error) {
    console.error('Public get tours error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

