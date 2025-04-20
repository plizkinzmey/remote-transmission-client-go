import React, { createContext, useContext } from 'react';
import { LoadingSpinner } from '@components/LoadingSpinner';
import { useLanguageInitialization } from './hooks/useLanguageInitialization';
import { useTranslations } from './hooks/useTranslations';
import type { LocalizationContextType, LocalizationProviderProps } from './types';

const LocalizationContext = createContext<LocalizationContextType | null>(null);

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({ children }) => {
    const {
        currentLanguage,
        availableLanguages,
        setLanguage,
        isLoading
    } = useLanguageInitialization();

    const { t } = useTranslations(currentLanguage);

    if (isLoading) {
        return <LoadingSpinner data-testid="loading-spinner" />;
    }

    return (
        <LocalizationContext.Provider
            value={{
                currentLanguage,
                availableLanguages,
                t,
                setLanguage,
                isLoading
            }}
        >
            {children}
        </LocalizationContext.Provider>
    );
};

export const useLocalization = () => {
    const context = useContext(LocalizationContext);

    if (!context) {
        throw new Error('useLocalization must be used within LocalizationProvider');
    }

    return context;
};