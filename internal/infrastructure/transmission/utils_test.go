package transmission

import (
	"testing"

	"github.com/hekmon/cunits/v2"
	"github.com/hekmon/transmissionrpc/v3"
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

// Дополнительные тесты для formatBytes для покрытия граничных случаев
func TestFormatBytes_EdgeCases(t *testing.T) {
	// Проверка на очень большое значение, превышающее последний юнит PiB
	hugeSizeInBytes := uint64(9223372036854775807) // максимально большое положительное int64
	result := formatBytes(hugeSizeInBytes, true)
	assert.Equal(t, "8.0 EiB", result, "Большие значения должны корректно отображаться с максимальным юнитом")

	// Проверка для маленьких значений (вместо нецелого 0.5 используем 0)
	tinySize := uint64(0) // целочисленный 0 вместо 0.5
	result = formatBytes(tinySize, true)
	assert.Equal(t, "0 B", result, "Малые значения должны корректно обрабатываться")

	// Тестирование очень маленького положительного значения (для покрытия случая i < 0)
	tinyNonZeroSize := uint64(1) // Очень маленькое значение
	result = formatBytes(tinyNonZeroSize, true)
	assert.Equal(t, "1.0 B", result, "Очень маленькие значения должны отображаться в байтах")

	// Тестирование очень большого значения
	// (для покрытия случая i >= len(sizes), использовать максимальный из доступных размеров)
	hugeValue := uint64(1) << 63 // Очень большое значение (2^63)
	result = formatBytes(hugeValue, true)
	assert.Equal(t, "8.0 EiB", result, "Экстремально большие значения должны использовать максимальный юнит")
}

// Тесты для getTorrentSizes
func TestGetTorrentSizes(t *testing.T) {
	// Создаем моки для тестирования разных сценариев с правильными типами
	testSizeWhenDoneBits := cunits.Bits(1024 * 1024 * 5 * 8) // 5 MiB в битах
	testDownloadedEver := int64(1024 * 1024 * 2)             // 2 MiB в байтах
	testHaveValid := int64(1024 * 1024 * 3)                  // 3 MiB в байтах (не биты)

	t.Run("AllFieldsPresent", func(t *testing.T) {
		torrent := transmissionrpc.Torrent{
			SizeWhenDone:   &testSizeWhenDoneBits, // *cunits.Bits
			DownloadedEver: &testDownloadedEver,   // *int64
			HaveValid:      &testHaveValid,        // *int64
		}

		total, downloaded := getTorrentSizes(torrent)

		expectedTotal := uint64(testSizeWhenDoneBits) / 8 // конвертация из бит в байты
		expectedDownloaded := uint64(testDownloadedEver)  // уже в байтах

		assert.Equal(t, expectedTotal, total, "Total size should match SizeWhenDone converted to bytes")
		assert.Equal(t, expectedDownloaded, downloaded, "Downloaded size should match DownloadedEver")
	})

	t.Run("NoSizeWhenDone", func(t *testing.T) {
		torrent := transmissionrpc.Torrent{
			DownloadedEver: &testDownloadedEver, // *int64
			HaveValid:      &testHaveValid,      // *int64
		}

		total, downloaded := getTorrentSizes(torrent)

		expectedTotal := uint64(0) // если SizeWhenDone отсутствует, total должен быть 0
		expectedDownloaded := uint64(testDownloadedEver)

		assert.Equal(t, expectedTotal, total, "Total size should be 0 when SizeWhenDone is nil")
		assert.Equal(t, expectedDownloaded, downloaded, "Downloaded size should match DownloadedEver")
	})

	t.Run("NoDownloadedEver_UseHaveValid", func(t *testing.T) {
		torrent := transmissionrpc.Torrent{
			SizeWhenDone: &testSizeWhenDoneBits, // *cunits.Bits
			HaveValid:    &testHaveValid,        // *int64
		}

		total, downloaded := getTorrentSizes(torrent)

		expectedTotal := uint64(testSizeWhenDoneBits) / 8
		expectedDownloaded := uint64(testHaveValid) // HaveValid уже в байтах, не нужно делить на 8

		assert.Equal(t, expectedTotal, total, "Total size should match SizeWhenDone converted to bytes")
		assert.Equal(t, expectedDownloaded, downloaded, "Downloaded size should match HaveValid when DownloadedEver is nil")
	})

	t.Run("AllFieldsNil", func(t *testing.T) {
		torrent := transmissionrpc.Torrent{}

		total, downloaded := getTorrentSizes(torrent)

		assert.Equal(t, uint64(0), total, "Total size should be 0 when all fields are nil")
		assert.Equal(t, uint64(0), downloaded, "Downloaded size should be 0 when all fields are nil")
	})
}
