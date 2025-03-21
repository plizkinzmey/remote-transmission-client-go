package domain

type TorrentStatus string

const (
	StatusStopped     TorrentStatus = "stopped"
	StatusDownloading TorrentStatus = "downloading"
	StatusSeeding     TorrentStatus = "seeding"
	StatusCompleted   TorrentStatus = "completed"
	StatusChecking    TorrentStatus = "checking"
	StatusQueued      TorrentStatus = "queued"
)

// Структура для представления файла в торренте
type TorrentFile struct {
	ID       int
	Name     string
	Path     string
	Size     int64
	Progress float64
	Wanted   bool
}

type Torrent struct {
	ID                     int64
	Name                   string
	Status                 TorrentStatus
	Progress               float64
	Size                   int64 // Возвращаем тип int64
	SizeFormatted          string
	UploadRatio            float64
	SeedsConnected         int
	SeedsTotal             int
	PeersConnected         int
	PeersTotal             int
	UploadedBytes          int64
	UploadedFormatted      string
	DownloadSpeed          int64
	UploadSpeed            int64
	DownloadSpeedFormatted string
	UploadSpeedFormatted   string
	IsSlowMode             bool
}

type TorrentRepository interface {
	GetAll() ([]Torrent, error)
	Add(url string, downloadDir string) error
	AddFile(filepath string, downloadDir string) error
	Remove(id int64, deleteData bool) error
	Start(ids []int64) error
	Stop(ids []int64) error
	GetSessionStats() (*SessionStats, error) // Новый метод для получения статистики сессии

	// Новые методы для работы с файлами
	GetTorrentFiles(id int64) ([]TorrentFile, error)
	SetFilesWanted(id int64, fileIds []int, wanted bool) error
	SetTorrentSpeedLimit(ids []int64, downloadLimit int64, uploadLimit int64) error

	// Новые методы для работы с каталогами
	GetDefaultDownloadDir() (string, error)
}
