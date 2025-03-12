package infrastructure

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
)

// LocalizationService handles the application translations
type LocalizationService struct {
	translations     map[string]map[string]string
	fallbackLocale   string
	availableLocales []string
}

// NewLocalizationService creates a new localization service
func NewLocalizationService() (*LocalizationService, error) {
	service := &LocalizationService{
		translations:     make(map[string]map[string]string),
		fallbackLocale:   "en",
		availableLocales: []string{"en", "ru"},
	}

	err := service.loadTranslations()
	if err != nil {
		return nil, err
	}

	return service, nil
}

// loadTranslations loads all translation files
func (s *LocalizationService) loadTranslations() error {
	for _, locale := range s.availableLocales {
		err := s.loadTranslationFile(locale)
		if err != nil {
			return err
		}
	}
	return nil
}

// loadTranslationFile loads a specific translation file
func (s *LocalizationService) loadTranslationFile(locale string) error {
	// Get executable path to find translation files relative to it
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		return fmt.Errorf("failed to get current file path")
	}

	baseDir := filepath.Dir(filepath.Dir(filepath.Dir(filename)))
	filePath := filepath.Join(baseDir, "locales", fmt.Sprintf("%s.json", locale))

	data, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read translation file %s: %w", filePath, err)
	}

	var translations map[string]string
	if err := json.Unmarshal(data, &translations); err != nil {
		return fmt.Errorf("failed to unmarshal translations for %s: %w", locale, err)
	}

	s.translations[locale] = translations
	return nil
}

// Translate returns a translated string for the given key
func (s *LocalizationService) Translate(key string, locale string) string {
	// If locale is not supported, use fallback
	if _, ok := s.translations[locale]; !ok {
		locale = s.fallbackLocale
	}

	// Get translation from the specified locale
	if translation, ok := s.translations[locale][key]; ok {
		return translation
	}

	// If not found in specified locale, try fallback
	if locale != s.fallbackLocale {
		if translation, ok := s.translations[s.fallbackLocale][key]; ok {
			return translation
		}
	}

	// If no translation found, return the key as is
	return key
}

// GetAvailableLocales returns all available locales
func (s *LocalizationService) GetAvailableLocales() []string {
	return s.availableLocales
}

// GetSystemLocale tries to detect the system locale
func (s *LocalizationService) GetSystemLocale() string {
	// Get the system locale from environment variables
	envLocales := []string{
		os.Getenv("LC_ALL"),
		os.Getenv("LC_MESSAGES"),
		os.Getenv("LANG"),
	}

	for _, envLocale := range envLocales {
		if envLocale != "" {
			// Extract the language part from locale string (e.g. "en_US.UTF-8" -> "en")
			parts := strings.Split(envLocale, "_")
			if len(parts) > 0 {
				langCode := strings.ToLower(parts[0])

				// Check if this language is supported
				for _, supportedLocale := range s.availableLocales {
					if supportedLocale == langCode {
						return supportedLocale
					}
				}
			}
		}
	}

	// Default to fallback locale if system locale is not detected or not supported
	return s.fallbackLocale
}
