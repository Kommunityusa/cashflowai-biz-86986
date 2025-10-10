import { supabase } from "@/integrations/supabase/client";

interface TranslationCache {
  [key: string]: string;
}

const translationCache: TranslationCache = {};

export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string> {
  // Return original if same language
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  // Check memory cache first
  const cacheKey = `${sourceLanguage}:${targetLanguage}:${text}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  try {
    const { data, error } = await supabase.functions.invoke('translate', {
      body: {
        text,
        targetLanguage,
        sourceLanguage,
      },
    });

    if (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original text
    }

    const translated = data.translatedText;
    
    // Cache in memory
    translationCache[cacheKey] = translated;
    
    return translated;
  } catch (error) {
    console.error('Translation request failed:', error);
    return text; // Fallback to original text
  }
}

export async function translateObject<T extends Record<string, any>>(
  obj: T,
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<T> {
  if (sourceLanguage === targetLanguage) {
    return obj;
  }

  const translated: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      translated[key] = await translateText(value, targetLanguage, sourceLanguage);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      translated[key] = await translateObject(value, targetLanguage, sourceLanguage);
    } else {
      translated[key] = value;
    }
  }

  return translated as T;
}

// Batch translate multiple strings at once
export async function batchTranslate(
  texts: string[],
  targetLanguage: string,
  sourceLanguage: string = 'en'
): Promise<string[]> {
  if (sourceLanguage === targetLanguage) {
    return texts;
  }

  const promises = texts.map(text => 
    translateText(text, targetLanguage, sourceLanguage)
  );

  return Promise.all(promises);
}
