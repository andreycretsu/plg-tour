import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Helper function to match URL patterns (same as tours/tooltips)
function urlMatchesPattern(url: string, pattern: string): boolean {
  // Remove protocol and domain, keep only path
  try {
    const urlObj = new URL(url);
    const urlPath = urlObj.pathname;
    
    // Handle wildcard - matches everything
    if (pattern === '*') {
      return true;
    }
    
    // Handle path-based patterns
    if (pattern.startsWith('/')) {
      // Exact match
      if (pattern === urlPath) {
        return true;
      }
      
      // Wildcard at end: /teams/*
      if (pattern.endsWith('/*')) {
        const basePath = pattern.slice(0, -2);
        return urlPath === basePath || urlPath.startsWith(basePath + '/');
      }
      
      // Wildcard in middle: /teams/*/settings
      if (pattern.includes('*')) {
        const regexPattern = pattern
          .replace(/\*/g, '[^/]*')
          .replace(/\//g, '\\/');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(urlPath);
      }
    }
    
    // Legacy: full URL matching (backward compatibility)
    return url.includes(pattern) || pattern.includes(url);
  } catch (e) {
    // If URL parsing fails, fall back to simple string matching
    return url.includes(pattern) || pattern.includes(url);
  }
}

// GET /api/public/banners - Get banners for a URL (for extension/embed)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const apiToken = request.headers.get('x-api-token') || searchParams.get('token');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    if (!apiToken) {
      return NextResponse.json({ error: 'API token is required' }, { status: 401 });
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

    // Get user's workspace_id
    const workspaceResult = await query(
      `SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1`,
      [userId]
    );
    const workspaceId = workspaceResult.rows.length > 0 ? workspaceResult.rows[0].workspace_id : null;

    // Get all active banners for this user/workspace
    const bannersResult = await query(
      `SELECT * FROM banners 
       WHERE is_active = true 
       AND (workspace_id = $1 OR (workspace_id IS NULL AND user_id = $2))
       ORDER BY created_at DESC`,
      [workspaceId, userId]
    );

    // Filter banners by URL pattern
    const matchingBanners = bannersResult.rows.filter(banner => 
      urlMatchesPattern(url, banner.url_pattern)
    );

    return NextResponse.json(matchingBanners);
  } catch (error) {
    console.error('Get public banners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

