import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/banners/:id - Get single banner
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await query(
      `SELECT * FROM banners 
       WHERE id = $1 AND user_id = $2`,
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Get banner error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/banners/:id - Update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body = await request.json();
    const { 
      name, 
      urlPattern, 
      isActive, 
      // Content
      title,
      body: bannerBody,
      imageUrl,
      buttonText,
      // Position
      positionX,
      positionY,
      offsetX,
      offsetY,
      // Size
      width,
      height,
      // Styling
      cardBgColor,
      cardTextColor,
      cardBorderRadius,
      cardPadding,
      cardShadow,
      textAlign,
      cardBlurIntensity,
      cardBgOpacity,
      // Typography
      titleSize,
      bodySize,
      bodyLineHeight,
      // Button styling
      buttonColor,
      buttonTextColor,
      buttonBorderRadius,
      buttonSize,
      buttonPosition,
      buttonType,
      // Advanced
      zIndex,
      delayMs,
      // Frequency
      frequencyType,
      frequencyCount,
      frequencyDays,
    } = body;

    // Verify banner ownership
    const checkResult = await query(
      'SELECT id FROM banners WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    // Helper function to get shadow value
    const getShadowValue = (shadow: string) => {
      const shadowMap: Record<string, string> = {
        'none': 'none',
        'small': '0 2px 8px rgba(0,0,0,0.1)',
        'medium': '0 4px 20px rgba(0,0,0,0.15)',
        'large': '0 8px 30px rgba(0,0,0,0.2)',
        'extra': '0 12px 40px rgba(0,0,0,0.25)',
      };
      return shadowMap[shadow] || shadow || '0 4px 20px rgba(0,0,0,0.15)';
    };

    // Update banner
    const result = await query(
      `UPDATE banners 
       SET name = COALESCE($1, name),
           url_pattern = COALESCE($2, url_pattern),
           is_active = COALESCE($3, is_active),
           title = COALESCE($4, title),
           body = COALESCE($5, body),
           image_url = COALESCE($6, image_url),
           button_text = COALESCE($7, button_text),
           position_x = COALESCE($8, position_x),
           position_y = COALESCE($9, position_y),
           offset_x = COALESCE($10, offset_x),
           offset_y = COALESCE($11, offset_y),
           width = COALESCE($12, width),
           height = COALESCE($13, height),
           card_bg_color = COALESCE($14, card_bg_color),
           card_text_color = COALESCE($15, card_text_color),
           card_border_radius = COALESCE($16, card_border_radius),
           card_padding = COALESCE($17, card_padding),
           card_shadow = COALESCE($18, card_shadow),
           text_align = COALESCE($19, text_align),
           card_blur_intensity = COALESCE($20, card_blur_intensity),
           card_bg_opacity = COALESCE($21, card_bg_opacity),
           title_size = COALESCE($22, title_size),
           body_size = COALESCE($23, body_size),
           body_line_height = COALESCE($24, body_line_height),
           button_color = COALESCE($25, button_color),
           button_text_color = COALESCE($26, button_text_color),
           button_border_radius = COALESCE($27, button_border_radius),
           button_size = COALESCE($28, button_size),
           button_position = COALESCE($29, button_position),
           button_type = COALESCE($30, button_type),
           z_index = COALESCE($31, z_index),
           delay_ms = COALESCE($32, delay_ms),
           frequency_type = COALESCE($33, frequency_type),
           frequency_count = COALESCE($34, frequency_count),
           frequency_days = COALESCE($35, frequency_days),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $36 AND user_id = $37
       RETURNING *`,
      [
        name, urlPattern, isActive !== false,
        title, bannerBody, imageUrl, buttonText,
        positionX, positionY, offsetX, offsetY,
        width, height,
        cardBgColor, cardTextColor, cardBorderRadius, cardPadding, getShadowValue(cardShadow),
        textAlign, cardBlurIntensity, cardBgOpacity,
        titleSize, bodySize, bodyLineHeight,
        buttonColor, buttonTextColor, buttonBorderRadius,
        buttonSize, buttonPosition, buttonType,
        zIndex, delayMs,
        frequencyType, frequencyCount, frequencyDays,
        params.id, payload.userId
      ]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Update banner error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/banners/:id - Delete banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await query(
      'DELETE FROM banners WHERE id = $1 AND user_id = $2 RETURNING id',
      [params.id, payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete banner error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

