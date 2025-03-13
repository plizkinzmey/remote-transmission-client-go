package domain

// SessionStats содержит информацию о текущей сессии transmission
type SessionStats struct {
	TotalDownloadSpeed  int64  // Общая скорость загрузки в байтах/с
	TotalUploadSpeed    int64  // Общая скорость отдачи в байтах/с
	FreeSpace           int64  // Свободное место на диске в байтах
	TransmissionVersion string // Версия Transmission
}
