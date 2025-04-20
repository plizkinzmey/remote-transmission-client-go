import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { LoadingSpinner } from '@components/LoadingSpinner';
import { useTranslations } from './hooks/useTranslations';
import { useLanguageInitialization } from './hooks/useLanguageInitialization';
import type { LocalizationContextType, LocalizationProviderProps } from './types';
import styles from './LocalizationContext.module.css';

export const LocalizationContext = createContext<LocalizationContextType>({
    t: (key) => key,
    currentLanguage: 'en',
    setLanguage: () => Promise.resolve(),
    availableLanguages: [{ code: 'en', name: 'English' }],
    isLoading: true,
});

export const useLocalization = () => {
    const context = useContext(LocalizationContext);
    if (!context) {
        throw new Error('useLocalization must be used within LocalizationProvider');
    }
    return context;
};

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({
    children,
}) => {
    const {
        currentLanguage,
        availableLanguages,
        setLanguage,
        isLoading: isLanguageLoading,
    } = useLanguageInitialization();

    const { t, allTranslations, loadAllTranslations } = useTranslations(currentLanguage);

    useEffect(() => {
        if (availableLanguages.length > 0) {
            loadAllTranslations(availableLanguages.map(lang => lang.code))
                .catch(error => {
                    console.error('Failed to load translations:', error);
                });
        }
    }, [availableLanguages, loadAllTranslations]);

    const contextValue = useMemo(
        () => ({
            t,
            currentLanguage,
            setLanguage,
            availableLanguages,
            isLoading: isLanguageLoading || !Object.keys(allTranslations).length,
        }),
        [t, currentLanguage, setLanguage, availableLanguages, isLanguageLoading, allTranslations]
    );

    if (isLanguageLoading || !Object.keys(allTranslations).length) {
        return (
            <div className={styles.loadingContainer}>
                <LoadingSpinner data-testid="loading-spinner" />
            </div>
        );
    }

    return (
        <LocalizationContext.Provider value={contextValue}>
            {children}
        </LocalizationContext.Provider>
    );
};