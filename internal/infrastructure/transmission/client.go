package transmission

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"path/filepath"
	"strings"

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

// validatePath подготавливает и проверяет путь
func (c *TransmissionClient) validatePath(path string) (string, error) {
	if path == "" {
		return "", &LocalizedError{key: "errors.emptyPath"}
	}

	if filepath.VolumeName(path) != "" || strings.HasPrefix(path, "\\\\") {
		return path, nil
	}

	if strings.HasPrefix(path, "~/") {
		home, err := os.UserHomeDir()
		if (err != nil) {
			return "", &LocalizedError{key: "errors.invalidPath"}
		}
		path = filepath.Join(home, path[2:])
	}

	return path, nil
}

// checkAccessibility проверяет доступность пути
func (c *TransmissionClient) checkAccessibility(path string) error {
	parentDir := filepath.Dir(path)

	_, _, err := c.client.FreeSpace(c.ctx, parentDir)
	if err != nil {
		errStr := err.Error()
		switch {
		case strings.Contains(errStr, errPermissionDenied):
			return &LocalizedError{key: "errors.directoryAccessDenied"}
		case strings.Contains(errStr, errNoSuchFileOrDirectory):
			return &LocalizedError{key: "errors.parentDirectoryNotExists"}
		default:
			return &LocalizedError{key: "errors.directoryNotAccessible"}
		}
	}
	return nil
}

// ValidateDownloadPath проверяет существование и доступность пути для скачивания
func (c *TransmissionClient) ValidateDownloadPath(path string) error {
	validPath, err := c.validatePath(path)
	if err != nil {
		return err
	}

	return c.checkAccessibility(validPath)
}
