import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// CORS headers for public API
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Id, X-User-Email, X-User-Name',
};

// Handle OPTIONS (CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

// GET: Check if user has viewed content (bulk check for efficiency)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing API token' }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.slice(7);
    const userId = request.headers.get('x-user-id');
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing X-User-Id header' }, { status: 400, headers: corsHeaders });
    }

    // Get workspace from token
    const workspaceResult = await query(
      'SELECT id FROM workspaces WHERE api_token = $1',
      [token]
    );

    if (workspaceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid API token' }, { status: 401, headers: corsHeaders });
    }

    const workspaceId = workspaceResult.rows[0].id;

    // Get content type and IDs from query params
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type'); // 'tour' or 'tooltip'
    const contentIds = searchParams.get('ids')?.split(',').map(id => parseInt(id)).filter(Boolean);

    if (!contentType || !contentIds?.length) {
      return NextResponse.json({ error: 'Missing type or ids parameter' }, { status: 400, headers: corsHeaders });
    }

    // Get all views for this user and these content items
    const viewsResult = await query(
      `SELECT content_id, view_count, first_seen_at, last_seen_at 
       FROM user_views 
       WHERE workspace_id = $1 
         AND user_identifier = $2 
         AND content_type = $3 
         AND content_id = ANY($4)`,
      [workspaceId, userId, contentType, contentIds]
    );

    // Build response map
    const views: Record<number, { viewCount: number; firstSeen: string; lastSeen: string }> = {};
    for (const row of viewsResult.rows) {
      views[row.content_id] = {
        viewCount: row.view_count,
        firstSeen: row.first_seen_at,
        lastSeen: row.last_seen_at,
      };
    }

    return NextResponse.json({ views }, { headers: corsHeaders });
  } catch (error) {
    console.error('Views GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

// POST: Record a view event
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing API token' }, { status: 401, headers: corsHeaders });
    }

    const token = authHeader.slice(7);
    const body = await request.json();
    
    const { userId, userEmail, userName, contentType, contentId, metadata } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400, headers: corsHeaders });
    }

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'Missing contentType or contentId' }, { status: 400, headers: corsHeaders });
    }

    if (!['tour', 'tooltip'].includes(contentType)) {
      return NextResponse.json({ error: 'Invalid contentType' }, { status: 400, headers: corsHeaders });
    }

    // Get workspace from token
    const workspaceResult = await query(
      'SELECT id FROM workspaces WHERE api_token = $1',
      [token]
    );

    if (workspaceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid API token' }, { status: 401, headers: corsHeaders });
    }

    const workspaceId = workspaceResult.rows[0].id;

    // Upsert view record (insert or update)
    const result = await query(
      `INSERT INTO user_views (workspace_id, user_identifier, user_email, user_name, content_type, content_id, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (workspace_id, user_identifier, content_type, content_id)
       DO UPDATE SET 
         view_count = user_views.view_count + 1,
         last_seen_at = NOW(),
         user_email = COALESCE($3, user_views.user_email),
         user_name = COALESCE($4, user_views.user_name),
         metadata = COALESCE($7, user_views.metadata),
         updated_at = NOW()
       RETURNING id, view_count, first_seen_at, last_seen_at`,
      [workspaceId, userId, userEmail || null, userName || null, contentType, contentId, metadata ? JSON.stringify(metadata) : null]
    );

    const view = result.rows[0];

    return NextResponse.json({
      success: true,
      view: {
        id: view.id,
        viewCount: view.view_count,
        firstSeen: view.first_seen_at,
        lastSeen: view.last_seen_at,
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Views POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

