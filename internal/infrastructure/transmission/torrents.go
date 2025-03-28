package transmission

import (
	"encoding/base64"
	"fmt"
	"os"
	"strings"
	"transmission-client-go/internal/domain"

	"github.com/hekmon/transmissionrpc/v3"
)

// GetAll возвращает список всех торрентов
func (c *TransmissionClient) GetAll() ([]domain.Torrent, error) {
	torrents, err := c.client.TorrentGet(c.ctx, []string{
		"id", "name", "status", "percentDone",
		"uploadRatio", "peersConnected", "trackerStats", "uploadedEver",
		"leftUntilDone", "desiredAvailable", "haveValid", "sizeWhenDone",
		"rateDownload", "rateUpload", "downloadedEver",
		"downloadLimit", "uploadLimit", "downloadLimited", "uploadLimited",
		"recheckProgress", // Добавляем поле для отслеживания прогресса проверки
	}, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get torrents: %w", err)
	}

	result := make([]domain.Torrent, len(torrents))
	for i, t := range torrents {
		status := mapStatus(*t.Status, t)
		totalSize, downloadedSize := getTorrentSizes(t)
		uploadRatio, uploadedBytes := getUploadInfo(&t)
		downloadSpeed, uploadSpeed := getSpeedInfo(&t)

		// Расчет прогресса в зависимости от статуса
		var progress float64
		if status == domain.StatusChecking && t.RecheckProgress != nil {
			progress = *t.RecheckProgress * 100
		} else {
			progress = *t.PercentDone * 100
		}

		var sizeFormatted string
		if status == domain.StatusDownloading {
			sizeFormatted = fmt.Sprintf("%s / %s",
				formatBytes(downloadedSize, true),
				formatBytes(totalSize, true))
		} else {
			sizeFormatted = formatBytes(totalSize, true)
		}

		downloadSpeedFormatted := formatBytes(uint64(downloadSpeed), true) + "/s"
		uploadSpeedFormatted := formatBytes(uint64(uploadSpeed), true) + "/s"
		uploadedFormatted := formatBytes(uint64(uploadedBytes), true)

		peersConnected, seedsTotal, peersTotal := getPeerInfo(&t)

		isSlowMode := false
		if status == domain.StatusDownloading || status == domain.StatusSeeding {
			if (t.DownloadLimited != nil && *t.DownloadLimited) ||
				(t.UploadLimited != nil && *t.UploadLimited) {
				isSlowMode = true
			}
		}

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
			IsSlowMode:             isSlowMode,
		}
	}

	return result, nil
}

// Add добавляет новый торрент по URL или магнет-ссылке
func (c *TransmissionClient) Add(url string, downloadDir string) error {
	if downloadDir != "" {
		if err := c.ValidateDownloadPath(downloadDir); err != nil {
			return fmt.Errorf("invalid download directory: %w", err)
		}
	}

	if strings.HasPrefix(url, "data:") {
		return c.addFromBase64(url, downloadDir)
	}

	payload := transmissionrpc.TorrentAddPayload{
		Filename: &url,
	}

	if downloadDir != "" {
		payload.DownloadDir = &downloadDir
	}

	_, err := c.client.TorrentAdd(c.ctx, payload)
	if err != nil {
		errStr := err.Error()
		switch {
		case strings.Contains(errStr, errPermissionDenied):
			return fmt.Errorf(errPermissionDeniedForPath, downloadDir)
		case strings.Contains(errStr, errNoSuchFileOrDirectory):
			return fmt.Errorf(errDirectoryDoesNotExist, downloadDir)
		default:
			return fmt.Errorf("failed to add torrent: %w", err)
		}
	}

	return nil
}

// AddFile добавляет новый торрент из файла
func (c *TransmissionClient) AddFile(filepath string, downloadDir string) error {
	if downloadDir != "" {
		if err := c.ValidateDownloadPath(downloadDir); err != nil {
			return fmt.Errorf("invalid download directory: %w", err)
		}
	}

	metainfo, err := os.ReadFile(filepath)
	if err != nil {
		return fmt.Errorf("failed to read torrent file: %w", err)
	}

	metainfoB64 := base64.StdEncoding.EncodeToString(metainfo)
	payload := transmissionrpc.TorrentAddPayload{
		MetaInfo: &metainfoB64,
	}

	if downloadDir != "" {
		payload.DownloadDir = &downloadDir
	}

	_, err = c.client.TorrentAdd(c.ctx, payload)
	if err != nil {
		errStr := err.Error()
		switch {
		case strings.Contains(errStr, errPermissionDenied):
			return fmt.Errorf(errPermissionDeniedForPath, downloadDir)
		case strings.Contains(errStr, errNoSuchFileOrDirectory):
			return fmt.Errorf(errDirectoryDoesNotExist, downloadDir)
		default:
			return fmt.Errorf("failed to add torrent from file: %w", err)
		}
	}

	return nil
}

// addFromBase64 обрабатывает base64-закодированный торрент файл
func (c *TransmissionClient) addFromBase64(dataUrl string, downloadDir string) error {
	parts := strings.Split(dataUrl, ",")
	if len(parts) != 2 {
		return fmt.Errorf("invalid data URL format")
	}

	data, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		return fmt.Errorf("failed to decode base64 data: %w", err)
	}

	metainfoB64 := base64.StdEncoding.EncodeToString(data)
	payload := transmissionrpc.TorrentAddPayload{
		MetaInfo: &metainfoB64,
	}

	if downloadDir != "" {
		payload.DownloadDir = &downloadDir
	}

	_, err = c.client.TorrentAdd(c.ctx, payload)
	if err != nil {
		return fmt.Errorf("failed to add torrent: %w", err)
	}

	return nil
}

// Remove удаляет торрент
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

// Start запускает торренты
func (c *TransmissionClient) Start(ids []int64) error {
	err := c.client.TorrentStartIDs(c.ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to start torrents: %w", err)
	}
	return nil
}

// Stop останавливает торренты
func (c *TransmissionClient) Stop(ids []int64) error {
	err := c.client.TorrentStopIDs(c.ctx, ids)
	if err != nil {
		return fmt.Errorf("failed to stop torrents: %w", err)
	}
	return nil
}

// SetTorrentSpeedLimit устанавливает ограничение скорости для торрентов
func (c *TransmissionClient) SetTorrentSpeedLimit(ids []int64, downloadLimit int64, uploadLimit int64) error {
	args := transmissionrpc.TorrentSetPayload{
		IDs:             ids,
		DownloadLimited: &[]bool{downloadLimit > 0}[0],
		UploadLimited:   &[]bool{uploadLimit > 0}[0],
	}

	if downloadLimit > 0 {
		args.DownloadLimit = &[]int64{downloadLimit}[0]
	}
	if uploadLimit > 0 {
		args.UploadLimit = &[]int64{uploadLimit}[0]
	}

	return c.client.TorrentSet(c.ctx, args)
}

// SetSpeedLimitFromConfig устанавливает ограничение скорости из конфигурации
func (c *TransmissionClient) SetSpeedLimitFromConfig(ids []int64, config domain.Config, isSlowMode bool) error {
	if isSlowMode {
		speedLimit := convertSpeedToKBps(config.SlowSpeedLimit, config.SlowSpeedUnit)
		return c.SetTorrentSpeedLimit(ids, speedLimit, speedLimit)
	}
	return c.SetTorrentSpeedLimit(ids, 0, 0)
}

// VerifyTorrent запускает процесс проверки целостности данных торрента
func (c *TransmissionClient) VerifyTorrent(id int64) error {
	err := c.client.TorrentVerifyIDs(c.ctx, []int64{id})
	if err != nil {
		return fmt.Errorf("failed to verify torrent: %w", err)
	}
	return nil
}

// mapStatus преобразует статус торрента
func mapStatus(status transmissionrpc.TorrentStatus, torrent transmissionrpc.Torrent) domain.TorrentStatus {
	if status == transmissionrpc.TorrentStatusStopped && torrent.PercentDone != nil && *torrent.PercentDone == 1.0 {
		return domain.StatusCompleted
	}

	switch status {
	case transmissionrpc.TorrentStatusStopped:
		return domain.StatusStopped
	case transmissionrpc.TorrentStatusCheckWait:
		return domain.StatusQueuedCheck
	case transmissionrpc.TorrentStatusCheck:
		return domain.StatusChecking
	case transmissionrpc.TorrentStatusDownloadWait:
		return domain.StatusQueuedDown
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
