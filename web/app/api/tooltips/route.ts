import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/tooltips - List all tooltips for workspace
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
      const memberResult = await query(
        `SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1`,
        [payload.userId]
      );
      if (memberResult.rows.length > 0) {
        workspaceId = memberResult.rows[0].workspace_id;
      }
    }

    const result = await query(
      `SELECT id, name, url_pattern, selector, is_active, trigger_type, 
              icon_type, title, created_at, updated_at
       FROM tooltips 
       WHERE workspace_id = $1 OR (workspace_id IS NULL AND user_id = $2)
       ORDER BY created_at DESC`,
      [workspaceId, payload.userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get tooltips error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/tooltips - Create new tooltip
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

    // Get workspace_id
    let workspaceId = payload.workspaceId;
    if (!workspaceId) {
      const memberResult = await query(
        `SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1`,
        [payload.userId]
      );
      if (memberResult.rows.length > 0) {
        workspaceId = memberResult.rows[0].workspace_id;
      }
    }

    const body = await request.json();
    const {
      name,
      urlPattern,
      selector,
      triggerType = 'click',
      dismissType = 'button',
      // Beacon settings
      iconType = 'pulse',
      iconEdge = 'right',
      iconOffset = 0,
      iconOffsetY = 0,
      iconSize = 'medium',
      iconColor = '#3b82f6',
      // Card content
      title,
      body: tooltipBody,
      imageUrl,
      // Card styling
      cardWidth = 320,
      cardPadding = 20,
      cardBorderRadius = 12,
      cardShadow = '0 4px 20px rgba(0,0,0,0.15)',
      textAlign = 'left',
      cardTextColor = '#1f2937',
      cardBgColor = '#ffffff',
      // Button styling
      buttonText = 'Got it',
      buttonColor = '#3b82f6',
      buttonTextColor = '#ffffff',
      buttonBorderRadius = 8,
      // Advanced
      zIndex = 2147483647,
      showOnce = true,
      delayMs = 0,
    } = body;

    // Validation
    if (!name || !urlPattern || !selector || !title) {
      return NextResponse.json(
        { error: 'Name, URL pattern, selector, and title are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO tooltips (
        workspace_id, user_id, name, url_pattern, selector,
        trigger_type, dismiss_type,
        icon_type, icon_edge, icon_offset, icon_offset_y, icon_size, icon_color,
        title, body, image_url,
        card_width, card_padding, card_border_radius, card_shadow, text_align, card_text_color, card_bg_color,
        button_text, button_color, button_text_color, button_border_radius,
        z_index, show_once, delay_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
      RETURNING *`,
      [
        workspaceId, payload.userId, name, urlPattern, selector,
        triggerType, dismissType,
        iconType, iconEdge, iconOffset, iconOffsetY, iconSize, iconColor,
        title, tooltipBody, imageUrl,
        cardWidth, cardPadding, cardBorderRadius, cardShadow, textAlign, cardTextColor, cardBgColor,
        buttonText, buttonColor, buttonTextColor, buttonBorderRadius,
        zIndex, showOnce, delayMs
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create tooltip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
