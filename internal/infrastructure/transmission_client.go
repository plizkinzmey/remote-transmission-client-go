package infrastructure

import (
	"context"
	"encoding/base64"
	"fmt"
	"math"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"transmission-client-go/internal/domain"

	"github.com/hekmon/transmissionrpc/v3"
)

type TransmissionConfig struct {
	Host     string
	Port     int
	Username string
	Password string
}

type TransmissionClient struct {
	client *transmissionrpc.Client
	ctx    context.Context
}

func NewTransmissionClient(config TransmissionConfig) (*TransmissionClient, error) {
	// Формируем URL для подключения
	var endpoint url.URL
	endpoint.Scheme = "http"
	if strings.HasPrefix(config.Host, "https://") {
		endpoint.Scheme = "https"
	}

	// Очищаем хост от протокола
	host := strings.TrimPrefix(config.Host, "http://")
	host = strings.TrimPrefix(host, "https://")

	// Убираем любой path из хоста, если он есть
	if idx := strings.Index(host, "/"); idx != -1 {
		host = host[:idx]
	}

	endpoint.Host = fmt.Sprintf("%s:%d", host, config.Port)

	// Добавляем стандартный RPC path
	endpoint.Path = "/transmission/rpc"

	// Добавляем учетные данные в URL, если они предоставлены
	if config.Username != "" {
		endpoint.User = url.UserPassword(config.Username, config.Password)
	}

	// Создаем клиент
	client, err := transmissionrpc.New(&endpoint, &transmissionrpc.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to create transmission client: %w", err)
	}

	return &TransmissionClient{
		client: client,
		ctx:    context.Background(),
	}, nil
}

// formatBytes преобразует размер в человеко-читаемый формат
func formatBytes(value uint64, isBytes bool) string {
	bytes := value
	if !isBytes {
		bytes = value / 8 // Конвертируем биты в байты если нужно
	}

	if bytes <= 0 {
		return "0 B"
	}

	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}

	units := []string{"B", "KiB", "MiB", "GiB", "TiB", "PiB"}
	exp := int(math.Log(float64(bytes)) / math.Log(float64(unit)))
	if exp >= len(units) {
		exp = len(units) - 1
	}

	size := float64(bytes) / math.Pow(float64(unit), float64(exp))
	return fmt.Sprintf("%.2f %s", size, units[exp])
}

// getTorrentSize возвращает общий размер и загруженный размер
func (c *TransmissionClient) getTorrentSizes(t transmissionrpc.Torrent) (total uint64, downloaded uint64) {
	total = uint64(0)
	downloaded = uint64(0)

	// Transmission возвращает размеры в битах, нужно преобразовать в байты
	if t.SizeWhenDone != nil {
		total = uint64(*t.SizeWhenDone) / 8 // Конвертируем биты в байты
	}

	// Используем DownloadedEver вместо HaveValid для учета всех скачанных данных
	if t.DownloadedEver != nil {
		downloaded = uint64(*t.DownloadedEver) // DownloadedEver уже в байтах
	} else if t.HaveValid != nil {
		// Если по какой-то причине DownloadedEver отсутствует, используем HaveValid как запасной вариант
		downloaded = uint64(*t.HaveValid) / 8
	}

	return total, downloaded
}

func (c *TransmissionClient) getPeerInfo(t transmissionrpc.Torrent) (int, int, int) {
	peersConnected := 0
	seedsTotal := 0
	peersTotal := 0

	if t.PeersConnected != nil {
		peersConnected = int(*t.PeersConnected)
	}

	if t.TrackerStats != nil {
		for _, tracker := range t.TrackerStats {
			seedsTotal += int(tracker.SeederCount)
			peersTotal += int(tracker.LeecherCount)
		}
	}

	return peersConnected, seedsTotal, peersTotal
}

func (c *TransmissionClient) getUploadInfo(t transmissionrpc.Torrent) (float64, int64) {
	uploadRatio := float64(0)
	uploadedBytes := int64(0)

	if t.UploadRatio != nil {
		uploadRatio = *t.UploadRatio
	}
	if t.UploadedEver != nil {
		uploadedBytes = int64(*t.UploadedEver) // Уже в байтах
	}

	return uploadRatio, uploadedBytes
}

// Добавляем новый метод для получения информации о скорости (в байтах/с)
func (c *TransmissionClient) getSpeedInfo(t transmissionrpc.Torrent) (downloadSpeed int64, uploadSpeed int64) {
	if t.RateDownload != nil {

		// Уже в байтах/с, не нужно делить на 8
		downloadSpeed = *t.RateDownload
	}
	if t.RateUpload != nil {

		// Уже в байтах/с, не нужно делить на 8
		uploadSpeed = *t.RateUpload
	}
	return
}

func (c *TransmissionClient) Start(ids []int64) error {
	err := c.client.TorrentStartIDs(c.ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to start torrents: %w", err)
	}
	return nil
}

func (c *TransmissionClient) Stop(ids []int64) error {
	err := c.client.TorrentStopIDs(c.ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to stop torrents: %w", err)
	}
	return nil
}

func (c *TransmissionClient) Add(url string) error {
	if strings.HasPrefix(url, "data:") {
		// Если это base64-закодированный файл
		return c.addFromBase64(url)
	}

	// Обычная ссылка или магнет-ссылка
	_, err := c.client.TorrentAdd(c.ctx, transmissionrpc.TorrentAddPayload{
		Filename: &url,
	})
	if err != nil {
		return fmt.Errorf("failed to add torrent: %w", err)
	}
	return nil
}

func (c *TransmissionClient) AddFile(filepath string) error {
	// Используем TorrentAddFile для добавления локального файла
	_, err := c.client.TorrentAddFile(c.ctx, filepath)
	if err != nil {
		return fmt.Errorf("failed to add torrent from file: %w", err)
	}
	return nil
}

// addFromBase64 обрабатывает base64-закодированный торрент файл
func (c *TransmissionClient) addFromBase64(dataUrl string) error {
	// Извлекаем base64-данные из data URL
	parts := strings.Split(dataUrl, ",")
	if len(parts) != 2 {
		return fmt.Errorf("invalid data URL format")
	}

	// Декодируем base64
	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return fmt.Errorf("failed to decode base64 data: %w", err)
	}

	// Создаем временный файл
	tmpDir, err := os.MkdirTemp("", "transmission-client")
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	tmpFile := filepath.Join(tmpDir, "temp.torrent")
	if err := os.WriteFile(tmpFile, data, 0600); err != nil {
		return fmt.Errorf("failed to write temp file: %w", err)
	}

	// Используем TorrentAddFile для добавления временного файла
	return c.AddFile(tmpFile)
}

func (c *TransmissionClient) Remove(id int64, deleteData bool) error {
	payload := transmissionrpc.TorrentRemovePayload{
		IDs:             []int64{id},
		DeleteLocalData: deleteData,
	}
	err := c.client.TorrentRemove(c.ctx, payload)
	if err != nil {
		return fmt.Errorf("failed to remove torrent: %w", err)
	}
	return nil
}

// Добавляем поле DownloadedEver в запрос
func (c *TransmissionClient) GetAll() ([]domain.Torrent, error) {
	torrents, err := c.client.TorrentGet(c.ctx, []string{
		"id", "name", "status", "percentDone",
		"uploadRatio", "peersConnected", "trackerStats", "uploadedEver",
		"leftUntilDone", "desiredAvailable", "haveValid", "sizeWhenDone",
		"rateDownload", "rateUpload", "downloadedEver",
	}, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get torrents: %w", err)
	}

	result := make([]domain.Torrent, len(torrents))
	for i, t := range torrents {
		status := mapStatus(*t.Status, t)
		totalSize, downloadedSize := c.getTorrentSizes(t)
		uploadRatio, uploadedBytes := c.getUploadInfo(t)
		peersConnected, seedsTotal, peersTotal := c.getPeerInfo(t)
		downloadSpeed, uploadSpeed := c.getSpeedInfo(t)

		// Используем процент загрузки напрямую из API
		progress := *t.PercentDone * 100

		// Форматируем размер в зависимости от статуса
		var sizeFormatted string
		if status == domain.StatusDownloading {
			sizeFormatted = fmt.Sprintf("%s / %s",
				formatBytes(downloadedSize, true),
				formatBytes(totalSize, true))
		} else {
			sizeFormatted = formatBytes(totalSize, true)
		}

		// Форматируем скорости (значения уже в байтах/с)
		downloadSpeedFormatted := formatBytes(uint64(downloadSpeed), true) + "/s"
		uploadSpeedFormatted := formatBytes(uint64(uploadSpeed), true) + "/s"

		// Форматируем выгруженное (значение уже в байтах)
		uploadedFormatted := formatBytes(uint64(uploadedBytes), true)

		result[i] = domain.Torrent{
			ID:                     *t.ID,
			Name:                   *t.Name,
			Status:                 status,
			Progress:               progress,
			Size:                   int64(totalSize),
			SizeFormatted:          sizeFormatted,
			UploadRatio:            uploadRatio,
			SeedsConnected:         peersConnected,
			SeedsTotal:             seedsTotal,
			PeersConnected:         peersConnected,
			PeersTotal:             peersTotal,
			UploadedBytes:          uploadedBytes,
			UploadedFormatted:      uploadedFormatted,
			DownloadSpeed:          downloadSpeed,
			UploadSpeed:            uploadSpeed,
			DownloadSpeedFormatted: downloadSpeedFormatted,
			UploadSpeedFormatted:   uploadSpeedFormatted,
		}
	}
	return result, nil
}

// GetSessionStats возвращает статистику текущей сессии Transmission
func (c *TransmissionClient) GetSessionStats() (*domain.SessionStats, error) {
	// Получаем сессию с необходимыми полями
	session, err := c.client.SessionArgumentsGet(c.ctx, []string{"download-dir", "version"})
	if err != nil {
		return nil, fmt.Errorf("failed to get session info: %w", err)
	}

	// Получаем статистику
	stats, err := c.client.SessionStats(c.ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get session stats: %w", err)
	}

	// Получаем информацию о свободном месте
	var freeSpace int64 = 0
	if session.DownloadDir != nil {
		// Получаем свободное место для директории загрузки
		freeSpaceInfo, _, err := c.client.FreeSpace(c.ctx, *session.DownloadDir)
		if err != nil {
			fmt.Printf("failed to get free space: %v\n", err)
		} else {
			// FreeSpace возвращает значение в битах, преобразуем в байты
			freeSpace = int64(freeSpaceInfo) / 8
			fmt.Printf("Free space in bytes: %d\n", freeSpace)
		}
	}

	// Версия Transmission
	version := "unknown"
	if session.Version != nil {
		version = *session.Version
	}

	// Возвращаем статистику
	return &domain.SessionStats{
		TotalDownloadSpeed:  stats.DownloadSpeed, // Значение уже в байтах/с
		TotalUploadSpeed:    stats.UploadSpeed,   // Значение уже в байтах/с
		FreeSpace:           freeSpace,           // Преобразовано из бит в байты
		TransmissionVersion: version,
	}, nil
}

func mapStatus(status transmissionrpc.TorrentStatus, torrent transmissionrpc.Torrent) domain.TorrentStatus {
	// Если торрент остановлен и загружен полностью, считаем его завершенным
	if status == transmissionrpc.TorrentStatusStopped && torrent.PercentDone != nil && *torrent.PercentDone == 1.0 {
		return domain.StatusCompleted
	}

	switch status {
	case transmissionrpc.TorrentStatusStopped:
		return domain.StatusStopped
	case transmissionrpc.TorrentStatusCheckWait, transmissionrpc.TorrentStatusCheck:
		return domain.StatusChecking
	case transmissionrpc.TorrentStatusDownloadWait:
		return domain.StatusQueued
	case transmissionrpc.TorrentStatusDownload:
		return domain.StatusDownloading
	case transmissionrpc.TorrentStatusSeedWait:
		return domain.StatusQueued
	case transmissionrpc.TorrentStatusSeed:
		return domain.StatusSeeding
	default:
		return domain.StatusStopped
	}
}
