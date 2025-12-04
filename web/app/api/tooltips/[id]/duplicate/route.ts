import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/tooltips/[id]/duplicate - Duplicate a tooltip
export async function POST(
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

    // Get original tooltip
    const original = await query(
      `SELECT * FROM tooltips WHERE id = $1`,
      [tooltipId]
    );

    if (original.rows.length === 0) {
      return NextResponse.json({ error: 'Tooltip not found' }, { status: 404 });
    }

    const tooltip = original.rows[0];

    // Create duplicate with is_active = false and "Copy of" prefix
    const result = await query(
      `INSERT INTO tooltips (
        workspace_id, name, url_pattern, selector, is_active,
        trigger_type, dismiss_type, icon_type, icon_edge, icon_offset, icon_offset_y,
        icon_size, icon_color, card_gap, card_offset_y, title, body, image_url,
        card_width, card_padding, card_border_radius, card_shadow, text_align,
        card_text_color, card_bg_color, button_text, button_color, button_text_color,
        button_border_radius, z_index, delay_ms, frequency_type, frequency_count,
        frequency_days, show_once
      ) VALUES (
        $1, $2, $3, $4, false,
        $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22,
        $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32,
        $33, $34
      ) RETURNING *`,
      [
        tooltip.workspace_id,
        `Copy of ${tooltip.name}`,
        tooltip.url_pattern,
        tooltip.selector,
        tooltip.trigger_type,
        tooltip.dismiss_type,
        tooltip.icon_type,
        tooltip.icon_edge,
        tooltip.icon_offset,
        tooltip.icon_offset_y,
        tooltip.icon_size,
        tooltip.icon_color,
        tooltip.card_gap || 12,
        tooltip.card_offset_y || 0,
        tooltip.title,
        tooltip.body,
        tooltip.image_url,
        tooltip.card_width,
        tooltip.card_padding,
        tooltip.card_border_radius,
        tooltip.card_shadow,
        tooltip.text_align,
        tooltip.card_text_color,
        tooltip.card_bg_color,
        tooltip.button_text,
        tooltip.button_color,
        tooltip.button_text_color,
        tooltip.button_border_radius,
        tooltip.z_index,
        tooltip.delay_ms,
        tooltip.frequency_type,
        tooltip.frequency_count,
        tooltip.frequency_days,
        tooltip.show_once
      ]
    );

    return NextResponse.json({ tooltip: result.rows[0] });
  } catch (error) {
    console.error('Duplicate tooltip error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

