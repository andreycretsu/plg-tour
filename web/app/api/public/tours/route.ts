import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Helper to check if URL matches pattern (supports * wildcards)
function urlMatchesPattern(url: string, pattern: string): boolean {
  // Normalize URLs - remove trailing slashes for comparison
  const normalizeUrl = (u: string) => u.replace(/\/+$/, '');
  const normalizedUrl = normalizeUrl(url);
  const normalizedPattern = normalizeUrl(pattern);
  
  // Convert wildcard pattern to regex
  const regexPattern = normalizedPattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special regex chars except *
    .replace(/\*/g, '.*'); // Convert * to .*
  
  try {
    // Match with optional trailing slash
    const regex = new RegExp(`^${regexPattern}\\/?.*$`, 'i');
    return regex.test(normalizedUrl);
  } catch {
    return false;
  }
}

// PUBLIC ENDPOINT: GET tours by API token (for extension)
export async function GET(request: NextRequest) {
  try {
    // Accept token from multiple sources
    let apiToken = request.headers.get('x-api-token');
    
    // Also accept Authorization: Bearer token
    if (!apiToken) {
      const authHeader = request.headers.get('authorization');
      apiToken = extractToken(authHeader);
    }

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
    const toursResult = await query(
      `SELECT t.id, t.name, t.url_pattern, t.is_active
       FROM tours t
       WHERE t.user_id = $1 AND t.is_active = true`,
      [userId]
    );

    let tours = toursResult.rows;

    // Filter by URL pattern if URL provided
    if (url) {
      tours = tours.filter(tour => urlMatchesPattern(url, tour.url_pattern));
    }

    // Get steps for each tour
    for (const tour of tours) {
      const stepsResult = await query(
        `SELECT id, step_order, selector, title, content, 
                image_url, button_text, placement, pulse_enabled, z_index
         FROM tour_steps 
         WHERE tour_id = $1 
         ORDER BY step_order ASC`,
        [tour.id]
      );
      tour.steps = stepsResult.rows;
    }

    return NextResponse.json({ tours });
  } catch (error) {
    console.error('Public get tours error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
