package domain

type TorrentStatus string

const (
	StatusStopped     TorrentStatus = "stopped"
	StatusDownloading TorrentStatus = "downloading"
	StatusSeeding     TorrentStatus = "seeding"
	StatusCompleted   TorrentStatus = "completed"
)

type Torrent struct {
	ID             int64
	Name           string
	Status         TorrentStatus
	Progress       float64
	Size           int64
	UploadRatio    float64
	SeedsConnected int
	SeedsTotal     int
	PeersConnected int
	PeersTotal     int
	UploadedBytes  int64
}

type TorrentRepository interface {
	GetAll() ([]Torrent, error)
	Add(url string) error
	AddFile(filepath string) error
	Remove(id int64, deleteData bool) error
	Start(ids []int64) error
	Stop(ids []int64) error
}
