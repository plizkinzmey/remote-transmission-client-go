import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { LoadingSpinner } from '@components/LoadingSpinner';
import { useTranslations } from './hooks/useTranslations';
import { useLanguageInitialization } from './hooks/useLanguageInitialization';
import type { LocalizationContextType, LocalizationProviderProps } from './types';
import styles from './LocalizationContext.module.css';

const LocalizationContext = createContext<LocalizationContextType>({
    t: (key) => key,
    currentLanguage: 'en',
    setLanguage: () => Promise.resolve(),
    availableLanguages: [{ code: 'en', name: 'English' }],
    isLoading: true,
});

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider: React.FC<LocalizationProviderProps> = ({
    children,
}) => {
    const {
        currentLanguage,
        availableLanguages,
        setLanguage,
        isLoading: isLanguageLoading,
    } = useLanguageInitialization();

    const { t, loadAllTranslations, allTranslations } = useTranslations(currentLanguage);

    // Load translations when language changes or on initial mount
    useEffect(() => {
        if (availableLanguages.length > 0) {
            loadAllTranslations(availableLanguages.map(lang => lang.code));
        }
    }, [availableLanguages, loadAllTranslations]);

    // Update window title when language changes
    useEffect(() => {
        const title = t('app.title');
        document.title = title;
    }, [currentLanguage, t]);

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
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <LocalizationContext.Provider value={contextValue}>
            {children}
        </LocalizationContext.Provider>
    );
};