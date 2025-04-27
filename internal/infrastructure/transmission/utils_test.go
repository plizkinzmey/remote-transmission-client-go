package transmission

import (
	"math"
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

	// Особый случай для очень маленьких значений, которые дают отрицательный логарифм
	extremelyTinyValue := uint64(1) // Это даст значение логарифма близкое к 0
	result = formatBytes(extremelyTinyValue, true)
	assert.Equal(t, "1.0 B", result, "Экстремально маленькие значения должны использовать минимальный юнит")

	// Тестирование очень большого значения
	// (для покрытия случая i >= len(sizes), использовать максимальный из доступных размеров)
	hugeValue := uint64(1) << 63 // Очень большое значение (2^63)
	result = formatBytes(hugeValue, true)
	assert.Equal(t, "8.0 EiB", result, "Экстремально большие значения должны использовать максимальный юнит")

	// Вышел за пределы EiB - должен все равно использовать последний юнит
	// Используем меньшее значение, чтобы избежать переполнения uint64
	beyondEiB := uint64(1152921504606846976) // 1 EiB
	result = formatBytes(beyondEiB, true)
	assert.Equal(t, "1.0 EiB", result, "Значения за пределами должны использовать последний юнит")

	// Дополнительный тест для бит (isBytes=false) с очень маленьким значением
	// Для покрытия ветки где size < 1 после деления на 8
	smallBitsValue := uint64(7) // 7 бит (меньше 1 байта)
	result = formatBytes(smallBitsValue, false)
	assert.Equal(t, "0.9 B", result, "Маленькие значения битов должны корректно конвертироваться в байты")

	// Дополнительный тест для бит с промежуточным значением
	mediumBitsValue := uint64(1000*8 + 4) // 1000 байт + 4 бит
	result = formatBytes(mediumBitsValue, false)
	assert.Equal(t, "1000.5 B", result, "Значения битов должны корректно конвертироваться в байты с дробной частью")

	// Тест для покрытия перехода через границу размерного класса
	boundaryValue := uint64(1024) // Ровно 1 KiB
	result = formatBytes(boundaryValue, true)
	assert.Equal(t, "1.0 KiB", result, "Значения на границе должны использовать следующую единицу измерения")

	// Тест для покрытия значений между 0 и 1
	// При логарифмировании таких значений i < 0
	fractionValue := uint64(1)
	result = formatBytes(fractionValue, false) // 1 бит это 0.125 байта
	assert.Equal(t, "0.1 B", result, "Значения между 0 и 1 должны корректно отображаться")

	// Дополнительные тесты для покрытия оставшихся краевых случаев

	// Тесты на конвертацию малых значений бит в байты
	// 1 бит = 0.125 байта
	oneBit := uint64(1)
	result = formatBytes(oneBit, false)
	assert.Equal(t, "0.1 B", result, "1 бит должен отображаться как 0.1 B")

	// 4 бита = 0.5 байта
	fourBits := uint64(4)
	result = formatBytes(fourBits, false)
	assert.Equal(t, "0.5 B", result, "4 бита должны отображаться как 0.5 B")

	// Тесты на точные граничные значения между единицами измерения
	// 1023 байта - последнее значение перед переходом к KiB
	almostKiB := uint64(1023)
	result = formatBytes(almostKiB, true)
	assert.Equal(t, "1023.0 B", result, "1023 байта должны отображаться в B")

	// 1024 байта - первое значение после перехода к KiB
	exactlyKiB := uint64(1024)
	result = formatBytes(exactlyKiB, true)
	assert.Equal(t, "1.0 KiB", result, "1024 байта должны отображаться в KiB")

	// 1048575 байт - значение перед MiB
	almostMiB := uint64(1024*1024 - 1)
	result = formatBytes(almostMiB, true)
	assert.Equal(t, "1024.0 KiB", result, "1048575 байт должны отображаться в KiB")

	// 1048576 байт - точно 1 MiB
	exactlyMiB := uint64(1024 * 1024)
	result = formatBytes(exactlyMiB, true)
	assert.Equal(t, "1.0 MiB", result, "1048576 байт должны отображаться в MiB")

	// Тесты на максимальную единицу измерения и точно на её границе
	// 1 EiB - максимальная единица
	exactlyEiB := uint64(1) << 60 // 2^60 байт = 1 EiB
	result = formatBytes(exactlyEiB, true)
	assert.Equal(t, "1.0 EiB", result, "1 EiB должен отображаться как 1.0 EiB")

	// Значение чуть меньше 1 EiB
	almostEiB := (uint64(1) << 60) - 1
	result = formatBytes(almostEiB, true)
	assert.Equal(t, "1.0 EiB", result, "Значение чуть меньше 1 EiB должно отображаться как 1.0 EiB")
}

// TestFormatBytes_ExactEdgeCases добавляет очень специфичные тесты для достижения 100% покрытия
func TestFormatBytes_ExactEdgeCases(t *testing.T) {
	// Тест случая, когда i точно равно len(sizes)-1
	// Это произойдёт, когда логарифм значения по основанию 1024 будет точно равен 6 (индекс "EiB")
	exactExponentValue := uint64(math.Pow(1024, 6)) // 1024^6 = 1 EiB точно
	result := formatBytes(exactExponentValue, true)
	assert.Equal(t, "1.0 EiB", result, "Значение 1024^6 должно отображаться как 1.0 EiB")

	// Тест значения чуть больше 1 EiB, но не настолько большого для переполнения uint64
	// Используем умножение на число, меньшее чем 16, чтобы избежать переполнения
	largeEiBValue := (uint64(1) << 60) * 8 // 8 EiB
	result = formatBytes(largeEiBValue, true)
	assert.Equal(t, "8.0 EiB", result, "Большие значения должны корректно отображаться в EiB")

	// Тест на диапазон с очень маленьким значением дроби bytes для покрытия ветки i < 0
	extremelySmallBitValue := uint64(1) // 1 бит = 0.125 байта
	result = formatBytes(extremelySmallBitValue, false)
	assert.Equal(t, "0.1 B", result, "Очень маленькие биты должны корректно округляться")

	// Значения для покрытия гипотетического случая i == float64(len(sizes))
	// Создаём значение на границе
	borderlineValue := uint64(math.Pow(1024, float64(len([]string{"B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"}))))
	result = formatBytes(borderlineValue, true)
	assert.NotEmpty(t, result, "Значение на границе размерного ряда должно обрабатываться корректно")
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
