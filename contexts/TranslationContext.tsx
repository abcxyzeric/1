
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { TranslationResult } from '../types';

interface TranslationContextType {
  inputText: string;
  setInputText: React.Dispatch<React.SetStateAction<string>>;
  translatedText: string;
  setTranslatedText: React.Dispatch<React.SetStateAction<string>>;
  sourceLang: string;
  setSourceLang: React.Dispatch<React.SetStateAction<string>>;
  targetLang: string;
  setTargetLang: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  tokenUsage: TranslationResult['usage'] | null;
  setTokenUsage: React.Dispatch<React.SetStateAction<TranslationResult['usage'] | null>>;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inputText, setInputText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('vi');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TranslationResult['usage'] | null>(null);

  return (
    <TranslationContext.Provider value={{
      inputText, setInputText,
      translatedText, setTranslatedText,
      sourceLang, setSourceLang,
      targetLang, setTargetLang,
      isLoading, setIsLoading,
      error, setError,
      tokenUsage, setTokenUsage
    }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslationState = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslationState must be used within a TranslationProvider');
  }
  return context;
};
