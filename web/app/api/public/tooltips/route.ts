import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Token',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// Helper to check if URL matches pattern
function urlMatchesPattern(url: string, pattern: string): boolean {
  const normalize = (u: string) => u.replace(/\/+$/, '').toLowerCase();
  const normalizedUrl = normalize(url);
  const normalizedPattern = normalize(pattern);
  
  if (normalizedPattern.endsWith('*')) {
    const prefix = normalizedPattern.slice(0, -1);
    return normalizedUrl.startsWith(prefix) || normalizedUrl + '/' === prefix;
  }
  
  return normalizedUrl === normalizedPattern || 
         normalizedUrl === normalizedPattern + '/' ||
         normalizedUrl + '/' === normalizedPattern;
}

// GET /api/public/tooltips - Get tooltips for current URL
export async function GET(request: NextRequest) {
  try {
    let apiToken = request.headers.get('x-api-token');
    
    if (!apiToken) {
      const authHeader = request.headers.get('authorization');
      apiToken = extractToken(authHeader);
    }

    if (!apiToken) {
      return NextResponse.json({ error: 'Missing API token' }, { status: 401, headers: corsHeaders });
    }

    // Find workspace by API token
    const workspaceResult = await query(
      'SELECT id FROM workspaces WHERE api_token = $1',
      [apiToken]
    );

    let workspaceId = null;
    let userId = null;

    if (workspaceResult.rows.length > 0) {
      workspaceId = workspaceResult.rows[0].id;
    } else {
      // Fallback to user token
      const userResult = await query(
        'SELECT id FROM users WHERE api_token = $1',
        [apiToken]
      );

      if (userResult.rows.length === 0) {
        return NextResponse.json({ error: 'Invalid API token' }, { status: 401, headers: corsHeaders });
      }

      userId = userResult.rows[0].id;
      
      const memberResult = await query(
        'SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1',
        [userId]
      );
      
      if (memberResult.rows.length > 0) {
        workspaceId = memberResult.rows[0].workspace_id;
      }
    }

    const url = request.nextUrl.searchParams.get('url');

    // Get active tooltips
    let tooltipsResult;
    if (workspaceId) {
      tooltipsResult = await query(
        `SELECT * FROM tooltips WHERE workspace_id = $1 AND is_active = true`,
        [workspaceId]
      );
    } else if (userId) {
      tooltipsResult = await query(
        `SELECT * FROM tooltips WHERE user_id = $1 AND is_active = true`,
        [userId]
      );
    } else {
      return NextResponse.json({ tooltips: [] }, { headers: corsHeaders });
    }

    let tooltips = tooltipsResult.rows;

    // Filter by URL pattern if URL provided
    if (url) {
      tooltips = tooltips.filter(tooltip => urlMatchesPattern(url, tooltip.url_pattern));
    }

    return NextResponse.json({ tooltips }, { headers: corsHeaders });
  } catch (error) {
    console.error('Public get tooltips error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

