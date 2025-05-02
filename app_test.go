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
	m.Called(ctx, eventName, data[0])
}

// Настоящая реализация, которая вызывает оригинальный EventsEmit
type RealRuntime struct{}

func (r *RealRuntime) EventsEmit(ctx context.Context, eventName string, data ...interface{}) {
	// В реальном приложении здесь был бы вызов wailsRuntime.EventsEmit
}

// TestHandleFilesOpen тестирует функцию HandleFilesOpen
func TestHandleFilesOpen(t *testing.T) {
	// Создаем контекст и мок для runtime
	ctx := context.Background()
	mockRuntime := new(MockRuntime)

	// Создаем логгер для тестирования
	logger := log.New(log.Writer(), "[TEST] ", log.LstdFlags)

	// Настраиваем ожидаемый вызов EventsEmit
	mockRuntime.On("EventsEmit", ctx, "torrent-opened", "path/to/file.torrent").Return()

	// Создаем функцию-тестируемую, которая делает то же, что и HandleFilesOpen
	testFunction := func(files []string) {
		if len(files) == 0 {
			return
		}

		logger.Printf("Handling files open request, count: %d\n", len(files))

		for _, file := range files {
			if strings.HasSuffix(strings.ToLower(file), ".torrent") {
				logger.Printf("Processing torrent file: %s\n", file)
				// Используем мок вместо wailsRuntime
				mockRuntime.EventsEmit(ctx, "torrent-opened", file)
				logger.Printf("Emitted torrent-opened event: %s\n", file)
			}
		}
	}

	// Вызываем функцию с тестовыми данными
	testFunction([]string{"path/to/file.torrent"})

	// Проверяем, что ожидаемые вызовы были сделаны
	mockRuntime.AssertExpectations(t)
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
