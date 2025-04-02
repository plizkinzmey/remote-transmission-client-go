package domain

// Config представляет конфигурацию приложения
type Config struct {
	Host                string   `json:"host"`
	Port                int      `json:"port"`
	Username            string   `json:"username"`
	Password            string   `json:"password"`
	Language            string   `json:"language"`            // Added for localization support
	Theme               string   `json:"theme"`               // Added for theme support: "light", "dark", "auto"
	MaxUploadRatio      float64  `json:"maxUploadRatio"`      // Maximum upload ratio before stopping torrent (0 means unlimited)
	SlowSpeedLimit      int      `json:"slowSpeedLimit"`      // Speed limit for slow mode in KiB/s or MiB/s
	SlowSpeedUnit       string   `json:"slowSpeedUnit"`       // Unit for slow speed limit: "KiB/s" or "MiB/s"
	DownloadPaths       []string `json:"downloadPaths"`       // История каталогов для скачивания
	DefaultDownloadPath string   `json:"defaultDownloadPath"` // Последний известный путь по умолчанию из Transmission
}

// ConnectionConfig представляет настройки соединения клиента
type ConnectionConfig struct {
	Host           string  `json:"host"`
	Port           int     `json:"port"`
	Username       string  `json:"username"`
	Password       string  `json:"password"`
	MaxUploadRatio float64 `json:"maxUploadRatio"`
	SlowSpeedLimit int     `json:"slowSpeedLimit"`
	SlowSpeedUnit  string  `json:"slowSpeedUnit"`
}

// PathsState представляет состояние путей
type PathsState struct {
	Paths       []string `json:"paths"`
	DefaultPath string   `json:"defaultPath"`
}

// PathsTransaction представляет транзакцию изменения путей
type PathsTransaction struct {
	PathsToAdd    []string    `json:"pathsToAdd"`
	PathsToRemove []string    `json:"pathsToRemove"`
	DefaultPath   string      `json:"defaultPath"`
	OriginalState *PathsState `json:"originalState"`
}

// GetPathsState возвращает текущее состояние путей
func (c *Config) GetPathsState() *PathsState {
	return &PathsState{
		Paths:       c.DownloadPaths,
		DefaultPath: c.DefaultDownloadPath,
	}
}

// ApplyPathsTransaction применяет транзакцию к конфигурации
func (c *Config) ApplyPathsTransaction(transaction *PathsTransaction) {
	// Удаляем пути
	newPaths := make([]string, 0)
	for _, path := range c.DownloadPaths {
		shouldKeep := true
		for _, pathToRemove := range transaction.PathsToRemove {
			if path == pathToRemove {
				shouldKeep = false
				break
			}
		}
		if shouldKeep {
			newPaths = append(newPaths, path)
		}
	}

	// Добавляем новые пути
	for _, pathToAdd := range transaction.PathsToAdd {
		if !contains(newPaths, pathToAdd) {
			newPaths = append(newPaths, pathToAdd)
		}
	}

	// Обновляем пути и путь по умолчанию
	c.DownloadPaths = newPaths
	if transaction.DefaultPath != "" {
		c.DefaultDownloadPath = transaction.DefaultPath
	}
}

// RollbackPathsTransaction откатывает изменения к исходному состоянию
func (c *Config) RollbackPathsTransaction(transaction *PathsTransaction) {
	if transaction.OriginalState != nil {
		c.DownloadPaths = transaction.OriginalState.Paths
		c.DefaultDownloadPath = transaction.OriginalState.DefaultPath
	}
}

// contains проверяет наличие строки в слайсе
func contains(slice []string, str string) bool {
	for _, v := range slice {
		if v == str {
			return true
		}
	}
	return false
}
