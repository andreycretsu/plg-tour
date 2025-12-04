import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/tooltips/[id] - Get single tooltip
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try cookie first, then Authorization header
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

    const tooltipId = parseInt(params.id);

    const result = await query(
      `SELECT * FROM tooltips WHERE id = $1`,
      [tooltipId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tooltip not found' }, { status: 404 });
    }

    return NextResponse.json({ tooltip: result.rows[0] });
  } catch (error) {
    console.error('Get tooltip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/tooltips/[id] - Update tooltip
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try cookie first, then Authorization header
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

    const tooltipId = parseInt(params.id);
    const body = await request.json();

    const {
      name,
      urlPattern,
      selector,
      isActive,
      triggerType,
      dismissType,
      // Beacon settings
      iconType,
      iconEdge,
      iconOffset,
      iconOffsetY,
      iconSize,
      iconColor,
      // Card position (relative to beacon)
      cardGap,
      cardOffsetY: cardPosOffsetY,
      // Card content
      title,
      body: tooltipBody,
      imageUrl,
      // Card styling
      cardWidth,
      cardPadding,
      cardBorderRadius,
      cardShadow,
      textAlign,
      cardTextColor,
      cardBgColor,
      // Button styling
      buttonText,
      buttonColor,
      buttonTextColor,
      buttonBorderRadius,
      // Advanced
      zIndex,
      delayMs,
      // Frequency
      frequencyType,
      frequencyCount,
      frequencyDays,
      showOnce,
    } = body;

    const result = await query(
      `UPDATE tooltips SET
        name = COALESCE($1, name),
        url_pattern = COALESCE($2, url_pattern),
        selector = COALESCE($3, selector),
        is_active = COALESCE($4, is_active),
        trigger_type = COALESCE($5, trigger_type),
        dismiss_type = COALESCE($6, dismiss_type),
        icon_type = COALESCE($7, icon_type),
        icon_edge = COALESCE($8, icon_edge),
        icon_offset = COALESCE($9, icon_offset),
        icon_offset_y = COALESCE($10, icon_offset_y),
        icon_size = COALESCE($11, icon_size),
        icon_color = COALESCE($12, icon_color),
        card_gap = COALESCE($13, card_gap),
        card_offset_y = COALESCE($14, card_offset_y),
        title = COALESCE($15, title),
        body = COALESCE($16, body),
        image_url = $17,
        card_width = COALESCE($18, card_width),
        card_padding = COALESCE($19, card_padding),
        card_border_radius = COALESCE($20, card_border_radius),
        card_shadow = COALESCE($21, card_shadow),
        text_align = COALESCE($22, text_align),
        card_text_color = COALESCE($23, card_text_color),
        card_bg_color = COALESCE($24, card_bg_color),
        button_text = COALESCE($25, button_text),
        button_color = COALESCE($26, button_color),
        button_text_color = COALESCE($27, button_text_color),
        button_border_radius = COALESCE($28, button_border_radius),
        z_index = COALESCE($29, z_index),
        delay_ms = COALESCE($30, delay_ms),
        frequency_type = COALESCE($31, frequency_type),
        frequency_count = COALESCE($32, frequency_count),
        frequency_days = COALESCE($33, frequency_days),
        show_once = COALESCE($34, show_once),
        updated_at = NOW()
      WHERE id = $35
      RETURNING *`,
      [
        name, urlPattern, selector, isActive,
        triggerType, dismissType,
        iconType, iconEdge, iconOffset, iconOffsetY, iconSize, iconColor,
        cardGap, cardPosOffsetY,
        title, tooltipBody, imageUrl,
        cardWidth, cardPadding, cardBorderRadius, cardShadow, textAlign, cardTextColor, cardBgColor,
        buttonText, buttonColor, buttonTextColor, buttonBorderRadius,
        zIndex, delayMs,
        frequencyType, frequencyCount, frequencyDays, showOnce,
        tooltipId
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tooltip not found' }, { status: 404 });
    }

    return NextResponse.json({ tooltip: result.rows[0] });
  } catch (error) {
    console.error('Update tooltip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/tooltips/[id] - Delete tooltip
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Try cookie first, then Authorization header
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

    const tooltipId = parseInt(params.id);

    const result = await query(
      `DELETE FROM tooltips WHERE id = $1 RETURNING id`,
      [tooltipId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Tooltip not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete tooltip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
