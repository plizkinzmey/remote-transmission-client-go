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
	client RPCClientInterface
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

	// Создаем конкретный клиент
	concreteClient, err := transmissionrpc.New(&endpoint, &transmissionrpc.Config{}) // <- Ищем ошибку здесь
	// NOTE: Покрытие тестами этой ветки затруднено.
	// Библиотека transmissionrpc.New устойчива к некорректным URL
	// на этапе создания клиента и редко возвращает ошибку здесь.
	// Ошибки (сетевые, аутентификации) обычно возникают позже, при вызове методов клиента.
	// Поэтому в unit-тестах сложно надежно спровоцировать эту ошибку.
	if err != nil {
		return nil, fmt.Errorf("failed to create transmission client: %w", err)
	}

	// Возвращаем структуру, где конкретный клиент присвоен полю интерфейсного типа
	return &TransmissionClient{
		client: concreteClient,
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
		if err != nil {
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
		// Изменяем ключ ошибки для errPermissionDenied обратно на directoryAccessDenied
		case strings.Contains(errStr, errPermissionDenied):
			return &LocalizedError{key: "errors.directoryAccessDenied"} // Возвращаем ожидаемый ключ для отказа в доступе
		case strings.Contains(errStr, errNoSuchFileOrDirectory):
			return &LocalizedError{key: "errors.parentDirectoryNotExists"}
		default:
			// Возвращаем общую ошибку для других случаев, как ожидают тесты
			return &LocalizedError{key: "errors.directoryNotAccessible"} // Исправлено на ожидаемый ключ
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
