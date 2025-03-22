package transmission

import (
	"errors"
	"fmt"
	"path/filepath"
	"transmission-client-go/internal/domain"

	"github.com/hekmon/transmissionrpc/v3"
)

// GetTorrentFiles возвращает список файлов торрента
func (c *TransmissionClient) GetTorrentFiles(id int64) ([]domain.TorrentFile, error) {
	torrents, err := c.client.TorrentGet(c.ctx, []string{
		"files", "fileStats", "name",
	}, []int64{id})

	if (err != nil) {
		return nil, fmt.Errorf("failed to get torrent files: %w", err)
	}

	if len(torrents) == 0 {
		return nil, fmt.Errorf("torrent not found")
	}

	t := torrents[0]

	if t.Files == nil || t.FileStats == nil {
		return nil, fmt.Errorf("no files information available")
	}

	if len(t.Files) == 0 || len(t.FileStats) == 0 {
		return []domain.TorrentFile{}, nil
	}

	if len(t.Files) != len(t.FileStats) {
		return nil, fmt.Errorf("files and file stats count mismatch")
	}

	result := make([]domain.TorrentFile, len(t.Files))
	for i, file := range t.Files {
		stats := t.FileStats[i]
		progress := float64(0)
		if file.Length > 0 {
			progress = float64(stats.BytesCompleted) / float64(file.Length) * 100
		}
		result[i] = domain.TorrentFile{
			ID:       i,
			Name:     filepath.Base(file.Name),
			Path:     file.Name,
			Size:     file.Length,
			Progress: progress,
			Wanted:   stats.Wanted,
		}
	}

	return result, nil
}

// SetFilesWanted устанавливает, нужно ли загружать файлы
func (c *TransmissionClient) SetFilesWanted(id int64, fileIds []int, wanted bool) error {
	fileIds64 := make([]int64, len(fileIds))
	for i, v := range fileIds {
		fileIds64[i] = int64(v)
	}

	payload := transmissionrpc.TorrentSetPayload{
		IDs: []int64{id},
	}

	if wanted {
		payload.FilesWanted = fileIds64
	} else {
		payload.FilesUnwanted = fileIds64
	}

	err := c.client.TorrentSet(c.ctx, payload)
	if err != nil {
		return fmt.Errorf("failed to set files wanted state: %w", err)
	}

	return nil
}

// GetDefaultDownloadDir возвращает каталог загрузки по умолчанию
func (c *TransmissionClient) GetDefaultDownloadDir() (string, error) {
	session, err := c.client.SessionArgumentsGet(c.ctx, []string{"download-dir"})
	if err != nil {
		return "", fmt.Errorf("failed to get default download directory: %w", err)
	}

	if session.DownloadDir == nil {
		return "", fmt.Errorf("default download directory not available")
	}

	return *session.DownloadDir, nil
}

// GetSessionStats возвращает статистику текущей сессии
func (c *TransmissionClient) GetSessionStats() (*domain.SessionStats, error) {
	session, err := c.client.SessionArgumentsGet(c.ctx, []string{"download-dir", "version"})
	if err != nil {
		return nil, fmt.Errorf("failed to get session info: %w", err)
	}

	stats, err := c.client.SessionStats(c.ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get session stats: %w", err)
	}

	var freeSpace int64 = 0
	if session.DownloadDir != nil {
		freeSpaceInfo, _, err := c.client.FreeSpace(c.ctx, *session.DownloadDir)
		if err != nil {
			fmt.Printf("failed to get free space: %v\n", err)
		} else {
			freeSpace = int64(freeSpaceInfo) / 8
		}
	}

	version := "unknown"
	if session.Version != nil {
		version = *session.Version
	}

	return &domain.SessionStats{
		TotalDownloadSpeed:  stats.DownloadSpeed,
		TotalUploadSpeed:    stats.UploadSpeed,
		FreeSpace:           freeSpace,
		TransmissionVersion: version,
	}, nil
}

// SaveDownloadPath сохраняет путь в историю путей скачивания
func (c *TransmissionClient) SaveDownloadPath(path string, config *domain.Config) error {
	if config == nil {
		return errors.New(errConfigNotInitialized)
	}

	// Проверяем, что путь не пустой
	if path == "" {
		return nil
	}

	// Создаем список путей, если его еще нет
	if config.DownloadPaths == nil {
		config.DownloadPaths = []string{}
	}

	// Проверяем, есть ли уже такой путь в списке
	for _, existingPath := range config.DownloadPaths {
		if existingPath == path {
			return nil
		}
	}

	// Добавляем новый путь в начало списка
	config.DownloadPaths = append([]string{path}, config.DownloadPaths...)

	// Ограничиваем длину списка до 10 элементов
	if len(config.DownloadPaths) > 10 {
		config.DownloadPaths = config.DownloadPaths[:10]
	}

	return nil
}

// RemoveDownloadPath удаляет путь из истории путей скачивания
func (c *TransmissionClient) RemoveDownloadPath(path string, config *domain.Config) error {
	if config == nil {
		return errors.New(errConfigNotInitialized)
	}

	if config.DownloadPaths == nil {
		return nil
	}

	// Ищем путь в списке и удаляем его
	for i, existingPath := range config.DownloadPaths {
		if existingPath == path {
			// Удаляем элемент, сохраняя порядок
			config.DownloadPaths = append(config.DownloadPaths[:i], config.DownloadPaths[i+1:]...)
			return nil
		}
	}

	return nil
}

// isPathInList проверяет наличие пути в списке
func (c *TransmissionClient) isPathInList(path string, paths []string) bool {
	for _, existingPath := range paths {
		if existingPath == path {
			return true
		}
	}
	return false
}

// GetDownloadPaths возвращает список сохраненных путей скачивания
func (c *TransmissionClient) GetDownloadPaths(config *domain.Config) ([]string, error) {
	if config == nil {
		return nil, errors.New(errConfigNotInitialized)
	}

	var result []string

	// Добавляем путь по умолчанию, если он есть
	defaultDir, err := c.GetDefaultDownloadDir()
	if err == nil && defaultDir != "" {
		result = append(result, defaultDir)
	}

	// Если нет путей в истории, возвращаем только путь по умолчанию
	if config.DownloadPaths == nil {
		return result, nil
	}

	// Добавляем только уникальные пути из истории
	for _, path := range config.DownloadPaths {
		if !c.isPathInList(path, result) {
			result = append(result, path)
		}
	}

	return result, nil
}
