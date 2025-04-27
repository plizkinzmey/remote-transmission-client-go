package transmission

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFormatBytes(t *testing.T) {
	tests := []struct {
		name     string
		bytes    int64 // Используем int64 для удобства определения тестов
		isBytes  bool
		expected string
	}{
		{"Zero", 0, true, "0 B"},
		{"Bytes", 500, true, "500.0 B"},
		{"KB", 1536, true, "1.5 KiB"},
		{"MB", 2 * 1024 * 1024, true, "2.0 MiB"},
		{"GB", 3 * 1024 * 1024 * 1024, true, "3.0 GiB"},
		{"TB", 4 * 1024 * 1024 * 1024 * 1024, true, "4.0 TiB"},
		{"PB", 5 * 1024 * 1024 * 1024 * 1024 * 1024, true, "5.0 PiB"}, // Максимальный юнит
		{"FractionalKB", 1200, true, "1.2 KiB"},
		{"LargeBytes", 1023, true, "1023.0 B"},
		{"BitsInputKB", 1536 * 8, false, "1.5 KiB"},            // Пример с isBytes = false
		{"BitsInputMB", 2 * 1024 * 1024 * 8, false, "2.0 MiB"}, // Пример с isBytes = false
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Приводим int64 к uint64 перед вызовом функции
			assert.Equal(t, tt.expected, formatBytes(uint64(tt.bytes), tt.isBytes))
		})
	}
}

// Тесты для других утилитных функций (getTorrentSizes, getPeerInfo и т.д.)
// могут потребовать мокирования структур transmissionrpc, что может быть сложнее.
// Начнем с formatBytes.
