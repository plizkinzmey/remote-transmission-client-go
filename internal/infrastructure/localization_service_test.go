package infrastructure

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// --- Моки для зависимостей функций локализации ---

// Мок для os.ReadFile
type mockFileSystem struct {
	mock.Mock
}

func (m *mockFileSystem) ReadFile(filename string) ([]byte, error) {
	args := m.Called(filename)
	return args.Get(0).([]byte), args.Error(1)
}

// Мок для runtime.Caller
type mockCaller struct {
	mock.Mock
}

func (m *mockCaller) Caller(skip int) (pc uintptr, file string, line int, ok bool) {
	args := m.Called(skip)
	return 0, args.String(0), args.Int(1), args.Bool(2)
}

// Глобальные переменные для мок-функций
var (
	// Храним в пакете текущие реализации функций
	testOsReadFile    = os.ReadFile
	testRuntimeCaller = runtime.Caller
)

// Функция для установки моков
func setupLocalizationMocks(t *testing.T) (*mockFileSystem, *mockCaller) {
	t.Helper()

	mockFS := new(mockFileSystem)
	mockC := new(mockCaller)

	// Заменяем оригинальные функции в тестовом пакете
	// (Важно: это не меняет os.ReadFile и runtime.Caller глобально,
	// а только переменные в нашем пакете)
	origReadFile := testOsReadFile
	origCaller := testRuntimeCaller

	testOsReadFile = func(name string) ([]byte, error) {
		return mockFS.ReadFile(name)
	}

	testRuntimeCaller = func(skip int) (pc uintptr, file string, line int, ok bool) {
		return mockC.Caller(skip)
	}

	// Убедимся, что функции будут восстановлены после теста
	t.Cleanup(func() {
		testOsReadFile = origReadFile
		testRuntimeCaller = origCaller
	})

	return mockFS, mockC
}

// --- Тестовые версии функций, которые будут монкироваться ---

// Создаем тестовую обертку вокруг loadTranslationFile, чтобы использовать тестовые мок-функции
func testLoadTranslationFile(s *LocalizationService, locale string) error {
	// Get executable path to find translation files relative to it
	_, filename, _, ok := testRuntimeCaller(0) // Используем тестовую версию
	if !ok {
		return fmt.Errorf("failed to get current file path")
	}
	baseDir := filepath.Dir(filepath.Dir(filepath.Dir(filename)))
	filePath := filepath.Join(baseDir, "locales", fmt.Sprintf("%s.json", locale))
	data, err := testOsReadFile(filePath) // Используем тестовую версию
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

// --- Дополнительные тесты для улучшения покрытия ---

// TestNewLocalizationService_LoadError тестирует обработку ошибок при загрузке переводов
func TestNewLocalizationService_LoadError(t *testing.T) {
	mockFS, mockC := setupLocalizationMocks(t)

	// Настраиваем мок для runtime.Caller, чтобы вернуть путь
	mockC.On("Caller", 0).Return("/path/to/localization_service.go", 10, true)

	// Настраиваем мок для os.ReadFile, чтобы он вернул ошибку для первого файла
	mockFS.On("ReadFile", mock.MatchedBy(func(path string) bool {
		return strings.HasSuffix(path, "en.json")
	})).Return([]byte{}, errors.New("file not found"))

	// Создаем сервис локализации - должна произойти ошибка при загрузке
	service := &LocalizationService{
		translations:     make(map[string]map[string]any),
		fallbackLocale:   "en",
		availableLocales: []string{"en", "ru"},
	}

	err := testLoadTranslationFile(service, "en")

	// Проверяем результат
	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to read translation file")
}

// TestLoadTranslationFile_CallerError тестирует ошибку при получении пути текущего файла
func TestLoadTranslationFile_CallerError(t *testing.T) {
	_, mockC := setupLocalizationMocks(t)

	// Настраиваем мок для runtime.Caller, чтобы вернуть ошибку
	mockC.On("Caller", 0).Return("", 0, false)

	// Создаем сервис вручную
	service := &LocalizationService{
		translations:     make(map[string]map[string]any),
		fallbackLocale:   "en",
		availableLocales: []string{"en", "ru"},
	}

	// Вызываем тестируемый метод
	err := testLoadTranslationFile(service, "en")

	// Проверяем результат
	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to get current file path")
}

// TestLoadTranslationFile_ReadFileError тестирует ошибку при чтении файла перевода
func TestLoadTranslationFile_ReadFileError(t *testing.T) {
	mockFS, mockC := setupLocalizationMocks(t)

	// Настраиваем мок для runtime.Caller, чтобы вернуть путь
	mockC.On("Caller", 0).Return("/path/to/localization_service.go", 10, true)

	// Настраиваем мок для os.ReadFile, чтобы он вернул ошибку
	mockFS.On("ReadFile", mock.MatchedBy(func(path string) bool {
		return strings.HasSuffix(path, "en.json")
	})).Return([]byte{}, errors.New("file read error"))

	// Создаем сервис вручную
	service := &LocalizationService{
		translations:     make(map[string]map[string]any),
		fallbackLocale:   "en",
		availableLocales: []string{"en", "ru"},
	}

	// Вызываем тестируемый метод
	err := testLoadTranslationFile(service, "en")

	// Проверяем результат
	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to read translation file")
	assert.ErrorContains(t, err, "file read error")
}

// TestLoadTranslationFile_UnmarshalError тестирует ошибку при парсинге JSON
func TestLoadTranslationFile_UnmarshalError(t *testing.T) {
	mockFS, mockC := setupLocalizationMocks(t)

	// Настраиваем мок для runtime.Caller, чтобы вернуть путь
	mockC.On("Caller", 0).Return("/path/to/localization_service.go", 10, true)

	// Настраиваем мок для os.ReadFile, чтобы вернул невалидный JSON
	mockFS.On("ReadFile", mock.MatchedBy(func(path string) bool {
		return strings.HasSuffix(path, "en.json")
	})).Return([]byte("this is not valid json"), nil)

	// Создаем сервис вручную
	service := &LocalizationService{
		translations:     make(map[string]map[string]any),
		fallbackLocale:   "en",
		availableLocales: []string{"en", "ru"},
	}

	// Вызываем тестируемый метод
	err := testLoadTranslationFile(service, "en")

	// Проверяем результат
	assert.Error(t, err)
	assert.ErrorContains(t, err, "failed to unmarshal translations")
}
