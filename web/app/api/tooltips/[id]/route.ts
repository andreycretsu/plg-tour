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
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

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
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

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
      iconType,
      iconPosition,
      iconPadding,
      iconSize,
      iconColor,
      iconBgColor,
      title,
      body: tooltipBody,
      imageUrl,
      cardWidth,
      textAlign,
      cardTextColor,
      cardBgColor,
      buttonText,
      buttonColor,
      zIndex,
      showOnce,
      delayMs,
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
        icon_position = COALESCE($8, icon_position),
        icon_padding = COALESCE($9, icon_padding),
        icon_size = COALESCE($10, icon_size),
        icon_color = COALESCE($11, icon_color),
        icon_bg_color = COALESCE($12, icon_bg_color),
        title = COALESCE($13, title),
        body = COALESCE($14, body),
        image_url = $15,
        card_width = COALESCE($16, card_width),
        text_align = COALESCE($17, text_align),
        card_text_color = COALESCE($18, card_text_color),
        card_bg_color = COALESCE($19, card_bg_color),
        button_text = COALESCE($20, button_text),
        button_color = COALESCE($21, button_color),
        z_index = COALESCE($22, z_index),
        show_once = COALESCE($23, show_once),
        delay_ms = COALESCE($24, delay_ms),
        updated_at = NOW()
      WHERE id = $25
      RETURNING *`,
      [
        name, urlPattern, selector, isActive,
        triggerType, dismissType,
        iconType, iconPosition, iconPadding, iconSize, iconColor, iconBgColor,
        title, tooltipBody, imageUrl,
        cardWidth, textAlign, cardTextColor, cardBgColor,
        buttonText, buttonColor, zIndex, showOnce, delayMs,
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
    const authHeader = request.headers.get('authorization');
    const token = extractToken(authHeader);

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

