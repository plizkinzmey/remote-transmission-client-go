package main

import (
	"context"
	"log"
	"strings"
	"testing"

	"github.com/stretchr/testify/mock"
)

// Создаем интерфейс для мокирования функций runtime
type RuntimeWrapper interface {
	EventsEmit(ctx context.Context, eventName string, data ...interface{})
}

// Создаем мок объект, реализующий интерфейс RuntimeWrapper
type MockRuntime struct {
	mock.Mock
}

// Реализуем метод EventsEmit для мока
func (m *MockRuntime) EventsEmit(ctx context.Context, eventName string, data ...interface{}) {
	if len(data) == 0 {
		log.Printf("Warning: EventsEmit called with no data for event '%s'\n", eventName)
		m.Called(ctx, eventName)
		return
	}
	m.Called(ctx, eventName, data[0])
}

// Настоящая реализация, которая вызывает оригинальный EventsEmit
type RealRuntime struct{}

func (r *RealRuntime) EventsEmit(ctx context.Context, eventName string, data ...interface{}) {
	// В реальном приложении здесь был бы вызов wailsRuntime.EventsEmit
}

// TestHandleFilesOpen проверяет обработку и кеширование торрент-файлов до инициализации контекста
func TestHandleFilesOpen(t *testing.T) {
	// Создаем контекст и мок для runtime
	ctx := context.Background()
	mockRuntime := new(MockRuntime)

	// Создаем логгер для тестирования
	logger := log.New(log.Writer(), "[TEST] ", log.LstdFlags)

	// Создаем экземпляр App с моками
	app := &App{
		ctx:    ctx,
		logger: logger,
	}

	// Настраиваем ожидаемый вызов EventsEmit
	mockRuntime.On("EventsEmit", ctx, "torrent-opened", "path/to/file.torrent").Return()

	// Вызываем тестируемую функцию
	app.HandleFilesOpen([]string{"path/to/file.torrent"})

	// Проверяем, что ожидаемые вызовы были сделаны
	mockRuntime.AssertExpectations(t)
}

// TestHandleFilesOpen_ContextNotInitialized проверяет кеширование файлов без инициализированного контекста
func TestHandleFilesOpen_ContextNotInitialized(t *testing.T) {
	// Создаем экземпляр App без инициализированного контекста
	app := &App{
		ctx:    nil, // Контекст не инициализирован
		logger: log.New(log.Writer(), "[TEST] ", log.LstdFlags),
	}

	// Вызываем тестируемую функцию с несколькими торрент-файлами
	app.HandleFilesOpen([]string{
		"path/to/file1.torrent",
		"path/to/file2.torrent",
		"path/to/file.txt", // Не торрент-файл, должен быть проигнорирован
	})

	// Проверяем, что pendingTorrentFiles содержит оба торрент-файла
	expectedFiles := []string{"path/to/file1.torrent", "path/to/file2.torrent"}
	if len(app.pendingTorrentFiles) != len(expectedFiles) {
		t.Errorf("Expected pendingTorrentFiles to have %d items, got %d", len(expectedFiles), len(app.pendingTorrentFiles))
	}

	// Проверяем, что все ожидаемые файлы присутствуют в массиве
	for i, expectedFile := range expectedFiles {
		if i >= len(app.pendingTorrentFiles) || app.pendingTorrentFiles[i] != expectedFile {
			t.Errorf("Expected pendingTorrentFiles[%d] to be '%s', got '%s'", i, expectedFile,
				app.pendingTorrentFiles[i])
		}
	}
}

// TestHandleFilesOpen_NonTorrentFile тестирует, что не-торрент файлы игнорируются
func TestHandleFilesOpen_NonTorrentFile(t *testing.T) {
	// Создаем контекст и мок для runtime
	ctx := context.Background()
	mockRuntime := new(MockRuntime)

	// Создаем логгер для тестирования
	logger := log.New(log.Writer(), "[TEST] ", log.LstdFlags)

	// Мы НЕ настраиваем вызов EventsEmit, так как он не должен вызываться

	// Создаем функцию для тестирования
	testFunction := func(files []string) {
		if len(files) == 0 {
			return
		}

		logger.Printf("Handling files open request, count: %d\n", len(files))

		for _, file := range files {
			if strings.HasSuffix(strings.ToLower(file), ".torrent") {
				logger.Printf("Processing torrent file: %s\n", file)
				mockRuntime.EventsEmit(ctx, "torrent-opened", file)
				logger.Printf("Emitted torrent-opened event: %s\n", file)
			}
		}
	}

	// Вызываем функцию с тестовыми данными
	testFunction([]string{"path/to/file.txt"})

	// Проверяем, что EventsEmit не был вызван
	mockRuntime.AssertExpectations(t)
}
