package infrastructure

import (
	"fmt"
	"os" // Import os for t.Setenv
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require" // Use require for setup checks
)

func TestNewLocalizationService(t *testing.T) {
	// This test now verifies loading of the *actual* locale files
	// because mocking runtime.Caller(0) is complex.

	service, err := NewLocalizationService()
	assert.NoError(t, err, "NewLocalizationService should load actual locale files without error")

	assert.NotNil(t, service)
	assert.Equal(t, "en", service.fallbackLocale)
	assert.Contains(t, service.availableLocales, "en")
	assert.Contains(t, service.availableLocales, "ru")

	// Check if translations maps were loaded
	assert.NotNil(t, service.translations["en"], "English translations should be loaded")
	assert.NotNil(t, service.translations["ru"], "Russian translations should be loaded")

	// Check a known key from the actual files (e.g., "common.close")
	enClose, okEn := service.translations["en"]["common"].(map[string]any)["close"].(string)
	assert.True(t, okEn, "Expected 'common.close' key in en.json")
	assert.NotEmpty(t, enClose, "'common.close' should not be empty in en.json")
	// assert.Equal(t, "Close", enClose) // Optionally check exact value if stable

	ruClose, okRu := service.translations["ru"]["common"].(map[string]any)["close"].(string)
	assert.True(t, okRu, "Expected 'common.close' key in ru.json")
	assert.NotEmpty(t, ruClose, "'common.close' should not be empty in ru.json")
	// assert.Equal(t, "Закрыть", ruClose) // Optionally check exact value if stable
}

func TestTranslate(t *testing.T) {
	// Setup service with predefined translations for testing Translate logic directly
	service := &LocalizationService{
		translations: map[string]map[string]any{
			"en": {
				"greeting":         "Hello",
				"farewell":         "Goodbye, {0}!",
				"nested":           map[string]any{"message": "This is a nested message."},
				"only_in_english":  "Only in English",
				"placeholder_test": "Replace {0} and {1}",
			},
			"ru": {
				"greeting":         "Привет",
				"farewell":         "Пока, {0}!",
				"nested":           map[string]any{"message": "Это вложенное сообщение."},
				"placeholder_test": "Заменить {0} и {1}",
			},
		},
		fallbackLocale:   "en",
		availableLocales: []string{"en", "ru"},
	}

	t.Run("SimpleTranslation_EN", func(t *testing.T) {
		result := service.Translate("greeting", "en")
		assert.Equal(t, "Hello", result)
	})

	t.Run("SimpleTranslation_RU", func(t *testing.T) {
		result := service.Translate("greeting", "ru")
		assert.Equal(t, "Привет", result)
	})

	t.Run("NestedTranslation_EN", func(t *testing.T) {
		result := service.Translate("nested.message", "en")
		assert.Equal(t, "This is a nested message.", result)
	})

	t.Run("NestedTranslation_RU", func(t *testing.T) {
		result := service.Translate("nested.message", "ru")
		assert.Equal(t, "Это вложенное сообщение.", result)
	})

	t.Run("FallbackTranslation", func(t *testing.T) {
		// Key exists only in English (fallback)
		result := service.Translate("only_in_english", "ru")
		assert.Equal(t, "Only in English", result)
	})

	t.Run("UnsupportedLocale", func(t *testing.T) {
		// "fr" is not supported, should use fallback "en"
		result := service.Translate("greeting", "fr")
		assert.Equal(t, "Hello", result)
	})

	t.Run("MissingKey", func(t *testing.T) {
		// Key does not exist in any locale
		result := service.Translate("nonexistent.key", "en")
		assert.Equal(t, "nonexistent.key", result) // Should return the key itself
	})

	t.Run("MissingKey_Fallback", func(t *testing.T) {
		result := service.Translate("nonexistent.key", "ru")
		assert.Equal(t, "nonexistent.key", result)
	})

	t.Run("TranslationWithArgs_EN", func(t *testing.T) {
		result := service.Translate("farewell", "en", "Alice")
		assert.Equal(t, "Goodbye, Alice!", result)
	})

	t.Run("TranslationWithArgs_RU", func(t *testing.T) {
		result := service.Translate("farewell", "ru", "Алиса")
		assert.Equal(t, "Пока, Алиса!", result)
	})

	t.Run("TranslationWithMultipleArgs_EN", func(t *testing.T) {
		result := service.Translate("placeholder_test", "en", "this", "that")
		assert.Equal(t, "Replace this and that", result)
	})

	t.Run("TranslationWithMultipleArgs_RU", func(t *testing.T) {
		result := service.Translate("placeholder_test", "ru", "это", "то")
		assert.Equal(t, "Заменить это и то", result)
	})

	t.Run("TranslationWithSliceArg_SingleElement", func(t *testing.T) {
		// processArgs should extract the single element from the slice
		result := service.Translate("farewell", "en", []string{"Bob"})
		assert.Equal(t, "Goodbye, Bob!", result)
	})

	t.Run("TranslationWithSliceArg_MultipleElements", func(t *testing.T) {
		// processArgs should use the slice representation
		slice := []string{"Bob", "Charlie"}
		result := service.Translate("farewell", "en", slice)
		// The default fmt representation of a slice is used
		assert.Equal(t, fmt.Sprintf("Goodbye, %v!", slice), result)
	})

	t.Run("TranslationWithNonStringArg", func(t *testing.T) {
		result := service.Translate("farewell", "en", 123)
		assert.Equal(t, "Goodbye, 123!", result)
	})
}

func TestGetAvailableLocales(t *testing.T) {
	service := &LocalizationService{
		availableLocales: []string{"en", "ru", "de"},
	}
	locales := service.GetAvailableLocales()
	assert.Equal(t, []string{"en", "ru", "de"}, locales)
}

func TestGetSystemLocale(t *testing.T) {
	service := &LocalizationService{
		availableLocales: []string{"en", "ru", "de"},
		fallbackLocale:   "en",
	}

	// Helper to set/unset env vars
	setenv := func(key, value string) {
		err := os.Setenv(key, value)
		require.NoError(t, err) // Use require for setup
		t.Cleanup(func() {
			os.Unsetenv(key)
		})
	}
	unsetenv := func(key string) {
		os.Unsetenv(key)
	}

	t.Run("LC_ALL_Supported", func(t *testing.T) {
		setenv("LC_ALL", "ru_RU.UTF-8")
		unsetenv("LC_MESSAGES")
		unsetenv("LANG")
		assert.Equal(t, "ru", service.GetSystemLocale())
	})

	t.Run("LC_MESSAGES_Supported", func(t *testing.T) {
		unsetenv("LC_ALL")
		setenv("LC_MESSAGES", "de_DE.UTF-8")
		unsetenv("LANG")
		assert.Equal(t, "de", service.GetSystemLocale())
	})

	t.Run("LANG_Supported", func(t *testing.T) {
		unsetenv("LC_ALL")
		unsetenv("LC_MESSAGES")
		setenv("LANG", "en_US.UTF-8")
		assert.Equal(t, "en", service.GetSystemLocale())
	})

	t.Run("LANG_OnlyLanguageCode", func(t *testing.T) {
		unsetenv("LC_ALL")
		unsetenv("LC_MESSAGES")
		setenv("LANG", "ru")
		assert.Equal(t, "ru", service.GetSystemLocale())
	})

	t.Run("UnsupportedLocale", func(t *testing.T) {
		setenv("LC_ALL", "fr_FR.UTF-8") // fr is not in availableLocales
		unsetenv("LC_MESSAGES")
		unsetenv("LANG")
		assert.Equal(t, service.fallbackLocale, service.GetSystemLocale())
	})

	t.Run("NoEnvVarsSet", func(t *testing.T) {
		unsetenv("LC_ALL")
		unsetenv("LC_MESSAGES")
		unsetenv("LANG")
		assert.Equal(t, service.fallbackLocale, service.GetSystemLocale())
	})

	t.Run("EmptyEnvVars", func(t *testing.T) {
		setenv("LC_ALL", "")
		setenv("LC_MESSAGES", "")
		setenv("LANG", "")
		assert.Equal(t, service.fallbackLocale, service.GetSystemLocale())
	})

	t.Run("Priority_LC_ALL_over_LANG", func(t *testing.T) {
		setenv("LC_ALL", "ru_RU.UTF-8")
		setenv("LANG", "en_US.UTF-8") // Should be ignored
		unsetenv("LC_MESSAGES")
		assert.Equal(t, "ru", service.GetSystemLocale())
	})
}

func TestGetAllTranslationKeys(t *testing.T) {
	// Setup service with predefined translations
	service := &LocalizationService{
		translations: map[string]map[string]any{
			"en": {
				"app": map[string]any{
					"title": "AppTitle",
					"nested": map[string]any{
						"key1": "NestedValue1",
					},
				},
				"common": map[string]any{
					"ok":     "OK",
					"cancel": "Cancel",
				},
				"only_en": "OnlyEnglish",
			},
			"ru": { // Fallback test needs this
				"app": map[string]any{
					"title": "Заголовок",
				},
				"common": map[string]any{
					"ok": "Хорошо",
				},
			},
		},
		fallbackLocale:   "en",
		availableLocales: []string{"en", "ru"},
	}

	t.Run("ExistingLocale", func(t *testing.T) {
		keys := service.GetAllTranslationKeys("en")
		expectedKeys := []string{
			"app.title",
			"app.nested.key1",
			"common.ok",
			"common.cancel",
			"only_en",
		}
		assert.ElementsMatch(t, expectedKeys, keys)
	})

	t.Run("NonExistingLocale_UsesFallback", func(t *testing.T) {
		keys := service.GetAllTranslationKeys("de") // 'de' is not in translations map
		expectedKeys := []string{                   // Should be keys from 'en' (fallback)
			"app.title",
			"app.nested.key1",
			"common.ok",
			"common.cancel",
			"only_en",
		}
		assert.ElementsMatch(t, expectedKeys, keys)
	})

	t.Run("EmptyTranslations", func(t *testing.T) {
		emptyService := &LocalizationService{
			translations:     map[string]map[string]any{"en": {}},
			fallbackLocale:   "en",
			availableLocales: []string{"en"},
		}
		keys := emptyService.GetAllTranslationKeys("en")
		assert.Empty(t, keys)
	})
}

// TODO: Add tests for error paths in loading functions if possible/needed
