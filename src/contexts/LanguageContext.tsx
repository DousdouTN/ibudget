import React, { createContext, useContext, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { messages } from '../i18n/messages';

interface LanguageContextType {
  locale: string;
  setLocale: (locale: string) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState('en');

  return (
    <LanguageContext.Provider value={{ locale, setLocale }}>
      <IntlProvider messages={messages[locale]} locale={locale} defaultLocale="en">
        {children}
      </IntlProvider>
    </LanguageContext.Provider>
  );
};