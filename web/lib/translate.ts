// Groq-powered translation using Llama 3
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'uk', name: 'Ukrainian', native: 'Українська' },
  { code: 'pl', name: 'Polish', native: 'Polski' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ru', name: 'Russian', native: 'Русский' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'it', name: 'Italian', native: 'Italiano' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'zh', name: 'Chinese', native: '中文' },
];

export interface TranslationResult {
  title: string;
  body: string;
  buttonText: string;
}

export async function translateContent(
  title: string,
  body: string,
  buttonText: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<TranslationResult> {
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY not configured');
    return { title, body, buttonText };
  }

  if (targetLanguage === sourceLanguage) {
    return { title, body, buttonText };
  }

  const targetLang = SUPPORTED_LANGUAGES.find(l => l.code === targetLanguage);
  const sourceLang = SUPPORTED_LANGUAGES.find(l => l.code === sourceLanguage);

  if (!targetLang) {
    return { title, body, buttonText };
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the following JSON content from ${sourceLang?.name || 'English'} to ${targetLang.name}. 
Keep the JSON structure exactly the same. Only translate the values, not the keys.
Return ONLY the translated JSON, no explanations or markdown.`
          },
          {
            role: 'user',
            content: JSON.stringify({
              title: title || '',
              body: body || '',
              buttonText: buttonText || ''
            })
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return { title, body, buttonText };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return { title, body, buttonText };
    }

    // Parse the translated JSON
    try {
      const translated = JSON.parse(content.trim());
      return {
        title: translated.title || title,
        body: translated.body || body,
        buttonText: translated.buttonText || buttonText,
      };
    } catch {
      console.error('Failed to parse translation response:', content);
      return { title, body, buttonText };
    }
  } catch (error) {
    console.error('Translation error:', error);
    return { title, body, buttonText };
  }
}

// Batch translate to multiple languages
export async function translateToAllLanguages(
  title: string,
  body: string,
  buttonText: string,
  sourceLanguage: string = 'en',
  targetLanguages?: string[]
): Promise<Record<string, TranslationResult>> {
  const targets = targetLanguages || SUPPORTED_LANGUAGES.map(l => l.code).filter(c => c !== sourceLanguage);
  
  const results: Record<string, TranslationResult> = {
    [sourceLanguage]: { title, body, buttonText }
  };

  // Translate in parallel (but limit concurrency)
  const batchSize = 3;
  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize);
    const translations = await Promise.all(
      batch.map(lang => translateContent(title, body, buttonText, lang, sourceLanguage))
    );
    
    batch.forEach((lang, index) => {
      results[lang] = translations[index];
    });
  }

  return results;
}

