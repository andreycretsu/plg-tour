import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/banners - List all banners for workspace
export async function GET(request: NextRequest) {
  try {
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
      `SELECT id, user_id, workspace_id, name, url_pattern, is_active, created_at, updated_at
       FROM banners 
       WHERE workspace_id = $1 OR (workspace_id IS NULL AND user_id = $2)
       ORDER BY created_at DESC`,
      [workspaceId, payload.userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Get banners error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/banners - Create new banner
export async function POST(request: NextRequest) {
  try {
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
      // Content
      title,
      body: bannerBody,
      imageUrl,
      buttonText = 'Got it',
      // Position
      positionX = 'center',
      positionY = 'top',
      offsetX = 0,
      offsetY = 0,
      // Size
      width = 400,
      height = 'auto',
      // Styling
      cardBgColor = '#ffffff',
      cardTextColor = '#1f2937',
      cardBorderRadius = 12,
      cardPadding = 20,
      cardShadow = '0 4px 20px rgba(0,0,0,0.15)',
      textAlign = 'left',
      cardBlurIntensity = 0,
      cardBgOpacity = 100,
      // Typography
      titleSize = 16,
      bodySize = 14,
      bodyLineHeight = 1.5,
      // Button styling
      buttonColor = '#3b82f6',
      buttonTextColor = '#ffffff',
      buttonBorderRadius = 8,
      buttonSize = 'm',
      buttonPosition = 'left',
      buttonType = 'regular',
      // Advanced
      zIndex = 2147483647,
      delayMs = 0,
      // Frequency
      frequencyType = 'once',
      frequencyCount = 1,
      frequencyDays = 7,
    } = body;

    // Validation
    if (!name || !urlPattern || !title) {
      return NextResponse.json(
        { error: 'Name, URL pattern, and title are required' },
        { status: 400 }
      );
    }

    // Validate urlPattern - allow * or path patterns
    if (urlPattern !== '*' && !urlPattern.startsWith('/')) {
      return NextResponse.json(
        { error: 'URL pattern must be * or start with /' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO banners (
        user_id, workspace_id, name, url_pattern,
        title, body, image_url, button_text,
        position_x, position_y, offset_x, offset_y,
        width, height,
        card_bg_color, card_text_color, card_border_radius, card_padding, card_shadow,
        text_align, card_blur_intensity, card_bg_opacity,
        title_size, body_size, body_line_height,
        button_color, button_text_color, button_border_radius,
        button_size, button_position, button_type,
        z_index, delay_ms,
        frequency_type, frequency_count, frequency_days
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36) 
       RETURNING *`,
      [
        payload.userId, workspaceId, name, urlPattern,
        title, bannerBody || null, imageUrl || null, buttonText,
        positionX, positionY, offsetX, offsetY,
        width, height,
        cardBgColor, cardTextColor, cardBorderRadius, cardPadding, cardShadow,
        textAlign, cardBlurIntensity, cardBgOpacity,
        titleSize, bodySize, bodyLineHeight,
        buttonColor, buttonTextColor, buttonBorderRadius,
        buttonSize, buttonPosition, buttonType,
        zIndex, delayMs,
        frequencyType, frequencyCount, frequencyDays
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Create banner error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

