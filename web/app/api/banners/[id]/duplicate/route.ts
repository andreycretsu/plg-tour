import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { extractToken, verifyToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/banners/:id/duplicate - Duplicate banner
export async function POST(
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

    // Get original banner
    const originalResult = await query(
      'SELECT * FROM banners WHERE id = $1 AND user_id = $2',
      [params.id, payload.userId]
    );

    if (originalResult.rows.length === 0) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 });
    }

    const original = originalResult.rows[0];

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

    // Create duplicate
    const result = await query(
      `INSERT INTO banners (
        user_id, workspace_id, name, url_pattern, is_active,
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
        payload.userId, workspaceId, `Copy of ${original.name}`, original.url_pattern, false,
        original.title, original.body, original.image_url, original.button_text,
        original.position_x, original.position_y, original.offset_x, original.offset_y,
        original.width, original.height,
        original.card_bg_color, original.card_text_color, original.card_border_radius, original.card_padding, original.card_shadow,
        original.text_align, original.card_blur_intensity, original.card_bg_opacity,
        original.title_size, original.body_size, original.body_line_height,
        original.button_color, original.button_text_color, original.button_border_radius,
        original.button_size, original.button_position, original.button_type,
        original.z_index, original.delay_ms,
        original.frequency_type, original.frequency_count, original.frequency_days
      ]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Duplicate banner error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

