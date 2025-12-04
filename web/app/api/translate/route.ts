import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractToken } from '@/lib/auth';
import { translateContent, translateToAllLanguages, SUPPORTED_LANGUAGES } from '@/lib/translate';

export const dynamic = 'force-dynamic';

// POST /api/translate - Translate content
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
    const { title, body: content, buttonText, targetLanguage, sourceLanguage = 'en', all = false } = body;

    if (all) {
      // Translate to all languages
      const translations = await translateToAllLanguages(
        title || '',
        content || '',
        buttonText || '',
        sourceLanguage
      );
      return NextResponse.json({ translations });
    } else if (targetLanguage) {
      // Translate to specific language
      const translated = await translateContent(
        title || '',
        content || '',
        buttonText || '',
        targetLanguage,
        sourceLanguage
      );
      return NextResponse.json({ translation: translated });
    } else {
      return NextResponse.json({ error: 'targetLanguage or all=true required' }, { status: 400 });
    }
  } catch (error) {
    console.error('Translate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/translate/languages - Get supported languages
export async function GET() {
  return NextResponse.json({ languages: SUPPORTED_LANGUAGES });
}

