package transmission

import (
	"context"

	"github.com/hekmon/cunits/v2" // Импортируем пакет для типа Bits
	"github.com/hekmon/transmissionrpc/v3"
	"github.com/stretchr/testify/mock"
)

// MockRPCClient — это мок для интерфейса RPCClientInterface.
type MockRPCClient struct {
	mock.Mock
}

// Убедимся, что MockRPCClient удовлетворяет нашему интерфейсу RPCClientInterface.
var _ RPCClientInterface = (*MockRPCClient)(nil)

// FreeSpace мокирует метод FreeSpace
// ИСПРАВЛЯЕМ СИГНАТУРУ ЗДЕСЬ: int64 -> cunits.Bits
func (m *MockRPCClient) FreeSpace(ctx context.Context, path string) (freeSpace, totalSize cunits.Bits, err error) {
	args := m.Called(ctx, path)

	fsArg := args.Get(0)
	tsArg := args.Get(1)

	// Проверяем и присваиваем тип cunits.Bits
	if fs, ok := fsArg.(cunits.Bits); ok {
		freeSpace = fs
	}
	// else if fsInt, ok := fsArg.(int64); ok { freeSpace = cunits.Bits(fsInt) } // Оставляем для возможной отладки

	if ts, ok := tsArg.(cunits.Bits); ok {
		totalSize = ts
	}
	// else if tsInt, ok := tsArg.(int64); ok { totalSize = cunits.Bits(tsInt) } // Оставляем для возможной отладки

	err = args.Error(2)
	return
}

// TorrentGet мокирует метод TorrentGet
func (m *MockRPCClient) TorrentGet(ctx context.Context, fields []string, ids []int64) (torrents []transmissionrpc.Torrent, err error) {
	args := m.Called(ctx, fields, ids)
	if args.Get(0) != nil {
		torrents = args.Get(0).([]transmissionrpc.Torrent)
	}
	err = args.Error(1)
	return
}

// SessionArgumentsGet мокирует метод SessionArgumentsGet
func (m *MockRPCClient) SessionArgumentsGet(ctx context.Context, fields []string) (sessionArgs transmissionrpc.SessionArguments, err error) {
	args := m.Called(ctx, fields)
	if args.Get(0) != nil {
		sessionArgs = args.Get(0).(transmissionrpc.SessionArguments)
	}
	err = args.Error(1)
	return
}

// SessionStats мокирует метод SessionStats
func (m *MockRPCClient) SessionStats(ctx context.Context) (stats transmissionrpc.SessionStats, err error) {
	args := m.Called(ctx)
	if args.Get(0) != nil {
		stats = args.Get(0).(transmissionrpc.SessionStats)
	}
	err = args.Error(1)
	return
}

// TorrentAdd мокирует метод TorrentAdd
func (m *MockRPCClient) TorrentAdd(ctx context.Context, payload transmissionrpc.TorrentAddPayload) (torrent transmissionrpc.Torrent, err error) {
	args := m.Called(ctx, payload)
	if args.Get(0) != nil {
		torrent = args.Get(0).(transmissionrpc.Torrent)
	}
	err = args.Error(1)
	return
}

// TorrentRemove мокирует метод TorrentRemove
func (m *MockRPCClient) TorrentRemove(ctx context.Context, payload transmissionrpc.TorrentRemovePayload) (err error) {
	args := m.Called(ctx, payload)
	err = args.Error(0)
	return
}

// TorrentStartIDs мокирует метод TorrentStartIDs
func (m *MockRPCClient) TorrentStartIDs(ctx context.Context, ids []int64) (err error) {
	args := m.Called(ctx, ids)
	err = args.Error(0)
	return
}

// TorrentStopIDs мокирует метод TorrentStopIDs
func (m *MockRPCClient) TorrentStopIDs(ctx context.Context, ids []int64) (err error) {
	args := m.Called(ctx, ids)
	err = args.Error(0)
	return
}

// TorrentSet мокирует метод TorrentSet
func (m *MockRPCClient) TorrentSet(ctx context.Context, payload transmissionrpc.TorrentSetPayload) (err error) {
	args := m.Called(ctx, payload)
	err = args.Error(0)
	return
}

// TorrentVerifyIDs мокирует метод TorrentVerifyIDs
func (m *MockRPCClient) TorrentVerifyIDs(ctx context.Context, ids []int64) (err error) {
	args := m.Called(ctx, ids)
	err = args.Error(0)
	return
}
