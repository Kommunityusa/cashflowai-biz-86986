import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TranslationCache {
  [key: string]: string;
}

export const useTranslation = () => {
  const [cache, setCache] = useState<TranslationCache>({});
  const [loading, setLoading] = useState(false);

  const translate = useCallback(async (
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<string> => {
    // Create cache key
    const cacheKey = `${sourceLanguage}-${targetLanguage}-${text}`;
    
    // Return from cache if available
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { text, targetLanguage, sourceLanguage }
      });

      if (error) {
        console.error('Translation error:', error);
        return text; // Return original text on error
      }

      const translatedText = data.translatedText;
      
      // Update cache
      setCache(prev => ({
        ...prev,
        [cacheKey]: translatedText
      }));

      return translatedText;
    } catch (error) {
      console.error('Translation request failed:', error);
      return text; // Return original text on error
    } finally {
      setLoading(false);
    }
  }, [cache]);

  const translateBatch = useCallback(async (
    texts: string[],
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<string[]> => {
    const translations = await Promise.all(
      texts.map(text => translate(text, targetLanguage, sourceLanguage))
    );
    return translations;
  }, [translate]);

  return {
    translate,
    translateBatch,
    loading,
    clearCache: () => setCache({})
  };
};
