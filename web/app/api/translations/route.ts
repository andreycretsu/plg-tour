import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken, extractToken } from '@/lib/auth';
import { translateToAllLanguages, SUPPORTED_LANGUAGES } from '@/lib/translate';

export const dynamic = 'force-dynamic';

// POST /api/translations - Auto-translate and save translations
export async function POST(request: NextRequest) {
  try {
    // Auth check
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
    const { contentType, contentId, title, body: content, buttonText, sourceLanguage = 'en' } = body;

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'contentType and contentId are required' }, { status: 400 });
    }

    // Translate to all languages
    const translations = await translateToAllLanguages(
      title || '',
      content || '',
      buttonText || '',
      sourceLanguage
    );

    // Save translations to database
    const savedLanguages = [];
    for (const [langCode, translation] of Object.entries(translations)) {
      if (langCode === sourceLanguage) continue; // Skip source language
      
      try {
        await query(
          `INSERT INTO translations (content_type, content_id, language_code, title, body, button_text)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (content_type, content_id, language_code) 
           DO UPDATE SET title = $4, body = $5, button_text = $6, updated_at = CURRENT_TIMESTAMP`,
          [contentType, contentId, langCode, translation.title, translation.body, translation.buttonText]
        );
        savedLanguages.push(langCode);
      } catch (err) {
        console.error(`Failed to save translation for ${langCode}:`, err);
      }
    }

    return NextResponse.json({ 
      success: true, 
      translatedTo: savedLanguages,
      message: `Translated to ${savedLanguages.length} languages`
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/translations - Get translations for content
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

    const contentType = request.nextUrl.searchParams.get('contentType');
    const contentId = request.nextUrl.searchParams.get('contentId');

    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'contentType and contentId are required' }, { status: 400 });
    }

    const result = await query(
      `SELECT language_code, title, body, button_text, updated_at
       FROM translations 
       WHERE content_type = $1 AND content_id = $2`,
      [contentType, contentId]
    );

    const translations: Record<string, any> = {};
    result.rows.forEach(row => {
      translations[row.language_code] = {
        title: row.title,
        body: row.body,
        buttonText: row.button_text,
        updatedAt: row.updated_at
      };
    });

    return NextResponse.json({ 
      translations,
      supportedLanguages: SUPPORTED_LANGUAGES
    });
  } catch (error) {
    console.error('Get translations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

