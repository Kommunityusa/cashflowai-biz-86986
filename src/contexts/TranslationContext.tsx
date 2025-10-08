import { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from './LanguageContext';

interface TranslationContextType {
  translateText: (text: string) => Promise<string>;
  isTranslating: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const { language } = useLanguage();
  const [isTranslating, setIsTranslating] = useState(false);
  const [cache, setCache] = useState<Record<string, string>>({});

  const translateText = async (text: string): Promise<string> => {
    // If English or already translated, return as is
    if (language === 'en' || !text) return text;

    // Check cache
    const cacheKey = `${text}-${language}`;
    if (cache[cacheKey]) {
      return cache[cacheKey];
    }

    setIsTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: {
          text,
          targetLanguage: language,
          sourceLanguage: 'en',
        },
      });

      if (error) throw error;

      const translatedText = data.translatedText;
      
      // Update cache
      setCache(prev => ({
        ...prev,
        [cacheKey]: translatedText,
      }));

      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Fallback to original
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <TranslationContext.Provider value={{ translateText, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslationContext() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationContext must be used within TranslationProvider');
  }
  return context;
}