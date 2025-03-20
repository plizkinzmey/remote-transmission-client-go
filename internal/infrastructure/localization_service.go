package infrastructure

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"reflect"
	"runtime"
	"strings"
)

// LocalizationService handles the application translations
type LocalizationService struct {
	translations     map[string]map[string]any
	fallbackLocale   string
	availableLocales []string
}

// NewLocalizationService creates a new localization service
func NewLocalizationService() (*LocalizationService, error) {
	service := &LocalizationService{
		translations:     make(map[string]map[string]any),
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

	// Загружаем в map с поддержкой вложенной структуры
	var translations map[string]any
	if err := json.Unmarshal(data, &translations); err != nil {
		return fmt.Errorf("failed to unmarshal translations for %s: %w", locale, err)
	}

	// Сохраняем с поддержкой вложенной структуры
	s.translations[locale] = translations
	return nil
}

// Translate returns a translated string for the given key
func (s *LocalizationService) Translate(key string, locale string, args ...any) string {
	// Проверяем локаль и получаем перевод
	translation := s.getTranslationForLocale(key, locale)

	// Если есть аргументы, заменяем плейсхолдеры
	if len(args) > 0 {
		translation = s.replacePlaceholders(translation, args)
	}

	return translation
}

// getTranslationForLocale получает перевод для указанной локали или запасной вариант
func (s *LocalizationService) getTranslationForLocale(key string, locale string) string {
	// Если локаль не поддерживается, используем запасной вариант
	if _, ok := s.translations[locale]; !ok {
		locale = s.fallbackLocale
	}

	// Получаем перевод для указанной локали
	translation := s.getNestedTranslation(key, locale)

	// Если перевод не найден в указанной локали, пробуем запасной вариант
	if translation == key && locale != s.fallbackLocale {
		translation = s.getNestedTranslation(key, s.fallbackLocale)
	}

	return translation
}

// replacePlaceholders заменяет плейсхолдеры в строке перевода аргументами
func (s *LocalizationService) replacePlaceholders(translation string, args []any) string {
	// Если перевод не найден (равен ключу), нет смысла заменять плейсхолдеры
	if translation == "" {
		return translation
	}

	// Обрабатываем аргументы для замены плейсхолдеров
	processedArgs := s.processArgs(args)

	// Заменяем плейсхолдеры {0}, {1}, ... на соответствующие аргументы
	for i, arg := range processedArgs {
		placeholder := fmt.Sprintf("{%d}", i)
		translation = strings.Replace(translation, placeholder, fmt.Sprintf("%v", arg), -1)
	}

	return translation
}

// processArgs обрабатывает аргументы, распаковывая массивы с одним элементом
func (s *LocalizationService) processArgs(args []any) []any {
	processedArgs := make([]any, 0, len(args))

	for _, arg := range args {
		// Проверяем, является ли аргумент массивом/слайсом
		val := reflect.ValueOf(arg)
		if val.Kind() == reflect.Slice || val.Kind() == reflect.Array {
			// Если это массив с одним элементом, используем его элемент
			if val.Len() == 1 {
				processedArgs = append(processedArgs, val.Index(0).Interface())
			} else {
				// Иначе используем сам массив
				processedArgs = append(processedArgs, arg)
			}
		} else {
			// Не массив, используем как есть
			processedArgs = append(processedArgs, arg)
		}
	}

	return processedArgs
}

// getNestedTranslation получает значение вложенного ключа в формате "app.title"
func (s *LocalizationService) getNestedTranslation(key string, locale string) string {
	parts := strings.Split(key, ".")

	// Начинаем с корневого объекта для заданной локали
	var currentObj any = s.translations[locale]

	// Проходим по частям ключа
	for _, part := range parts {
		// Проверяем, что текущий объект - карта
		if nestedMap, ok := currentObj.(map[string]any); ok {
			// Получаем следующую часть из карты
			currentObj = nestedMap[part]
			if currentObj == nil {
				// Если часть не найдена, возвращаем исходный ключ
				return key
			}
		} else {
			// Если это не карта, значит мы не можем продолжать навигацию
			return key
		}
	}

	// Если дошли до конца пути и получили строку - это наш перевод
	if strValue, ok := currentObj.(string); ok {
		return strValue
	}

	// В противном случае возвращаем исходный ключ
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
