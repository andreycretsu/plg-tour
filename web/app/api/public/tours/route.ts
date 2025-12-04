import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// CORS headers for cross-origin requests from extension and embed
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Token',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Helper to check if URL matches pattern (supports * wildcards)
function urlMatchesPattern(url: string, pattern: string): boolean {
  // Normalize both URLs - remove trailing slashes and protocol variations
  const normalize = (u: string) => u.replace(/\/+$/, '').toLowerCase();
  const normalizedUrl = normalize(url);
  const normalizedPattern = normalize(pattern);
  
  // If pattern ends with *, it's a prefix match
  if (normalizedPattern.endsWith('*')) {
    const prefix = normalizedPattern.slice(0, -1); // Remove the *
    return normalizedUrl.startsWith(prefix) || normalizedUrl + '/' === prefix;
  }
  
  // Otherwise, do exact match (with optional trailing slash)
  return normalizedUrl === normalizedPattern || 
         normalizedUrl === normalizedPattern + '/' ||
         normalizedUrl + '/' === normalizedPattern;
}

// PUBLIC ENDPOINT: GET tours by API token (for extension and embed)
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
      return NextResponse.json({ error: 'Missing API token' }, { status: 401, headers: corsHeaders });
    }

    // First try to find workspace by API token
    const workspaceResult = await query(
      'SELECT id FROM workspaces WHERE api_token = $1',
      [apiToken]
    );

    let workspaceId = null;
    let userId = null;

    if (workspaceResult.rows.length > 0) {
      // Token is a workspace API token
      workspaceId = workspaceResult.rows[0].id;
    } else {
      // Fallback: try user API token (for backwards compatibility)
      const userResult = await query(
        'SELECT id FROM users WHERE api_token = $1',
        [apiToken]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid API token' }, { status: 401, headers: corsHeaders });
      }

      userId = userResult.rows[0].id;
      
      // Get user's workspace
      const memberResult = await query(
        'SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      
      if (memberResult.rows.length > 0) {
        workspaceId = memberResult.rows[0].workspace_id;
      }
    }

    const url = request.nextUrl.searchParams.get('url');
    const lang = request.nextUrl.searchParams.get('lang') || 'en';

    // Get active tours - prefer workspace_id, fallback to user_id
    let toursResult;
    if (workspaceId) {
      toursResult = await query(
        `SELECT t.id, t.name, t.url_pattern, t.is_active
         FROM tours t
         WHERE t.workspace_id = $1 AND t.is_active = true`,
        [workspaceId]
      );
    } else if (userId) {
      // Legacy: get tours by user_id
      toursResult = await query(
        `SELECT t.id, t.name, t.url_pattern, t.is_active
         FROM tours t
         WHERE t.user_id = $1 AND t.is_active = true`,
        [userId]
      );
    } else {
      return NextResponse.json({ tours: [] }, { headers: corsHeaders });
    }

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

      // Apply translations for steps if language is not English
      if (lang && lang !== 'en' && tour.steps.length > 0) {
        const stepIds = tour.steps.map((s: any) => s.id);
        const translationsResult = await query(
          `SELECT content_id, title, body, button_text 
           FROM translations 
           WHERE content_type = 'tour_step' 
           AND content_id = ANY($1) 
           AND language_code = $2`,
          [stepIds, lang]
        );

        const translationsMap = new Map();
        translationsResult.rows.forEach(t => {
          translationsMap.set(t.content_id, t);
        });

        tour.steps = tour.steps.map((step: any) => {
          const translation = translationsMap.get(step.id);
          if (translation) {
            return {
              ...step,
              title: translation.title || step.title,
              content: translation.body || step.content,
              button_text: translation.button_text || step.button_text,
            };
          }
          return step;
        });
      }
    }

    return NextResponse.json({ tours }, { headers: corsHeaders });
  } catch (error) {
    console.error('Public get tours error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
