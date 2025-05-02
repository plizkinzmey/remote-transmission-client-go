package transmission

import (
	"context"

	"github.com/hekmon/cunits/v2" // Импортируем пакет для типа Bits
	"github.com/hekmon/transmissionrpc/v3"
)

// RPCClientInterface определяет методы клиента transmissionrpc, необходимые нашему пакету.
// Это позволяет нам мокировать зависимость в тестах.
type RPCClientInterface interface {
	// Используем правильные типы cunits.Bits из библиотеки
	FreeSpace(ctx context.Context, path string) (freeSpace, totalSize cunits.Bits, err error)
	TorrentGet(ctx context.Context, fields []string, ids []int64) (torrents []transmissionrpc.Torrent, err error)
	SessionArgumentsGet(ctx context.Context, fields []string) (sessionArgs transmissionrpc.SessionArguments, err error)
	SessionStats(ctx context.Context) (stats transmissionrpc.SessionStats, err error)
	TorrentAdd(ctx context.Context, payload transmissionrpc.TorrentAddPayload) (torrent transmissionrpc.Torrent, err error)
	TorrentRemove(ctx context.Context, payload transmissionrpc.TorrentRemovePayload) (err error)
	TorrentStartIDs(ctx context.Context, ids []int64) (err error)
	TorrentStopIDs(ctx context.Context, ids []int64) (err error)
	TorrentSet(ctx context.Context, payload transmissionrpc.TorrentSetPayload) (err error)
	TorrentVerifyIDs(ctx context.Context, ids []int64) (err error)
	// Добавьте сюда другие методы transmissionrpc.Client по мере необходимости
}

// Убедимся, что оригинальный *transmissionrpc.Client удовлетворяет нашему интерфейсу.
// Это статическая проверка во время компиляции.
var _ RPCClientInterface = (*transmissionrpc.Client)(nil)
