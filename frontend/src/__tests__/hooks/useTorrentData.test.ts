import { renderHook, act } from '@testing-library/react';
import { useTorrentData } from '../../hooks/useTorrentData';
import { createWailsMock, resetWailsMocks } from '../../utils/test/wailsTestUtils';

// Мокируем модули Wails перед запуском тестов
jest.mock('../../../wailsjs/go/main/App', () => ({
  GetTorrents: jest.fn(),
  AddTorrent: jest.fn(),
  AddTorrentFile: jest.fn(),
  RemoveTorrent: jest.fn(),
  LoadConfig: jest.fn(),
  Initialize: jest.fn(),
  StartTorrents: jest.fn(),
  StopTorrents: jest.fn(),
  GetSessionStats: jest.fn(),
  SetTorrentSpeedLimit: jest.fn(),
  VerifyTorrent: jest.fn(),
}), { virtual: true });

jest.mock('../../../wailsjs/runtime/runtime', () => ({
  LogInfo: jest.fn(),
  LogError: jest.fn(),
}), { virtual: true });

describe('useTorrentData hook', () => {
  beforeEach(() => {
    // Инициализация моков перед каждым тестом
    createWailsMock();
  });

  afterEach(() => {
    // Сброс состояния моков после каждого теста
    resetWailsMocks();
    jest.clearAllMocks();
  });

  it('должен инициализироваться с пустым массивом торрентов', () => {
    const { result } = renderHook(() => useTorrentData());
    
    expect(result.current.torrents).toEqual([]);
    expect(result.current.selectedTorrents).toEqual(new Set());
    expect(result.current.error).toBe(null);
  });

  // Другие тесты для хука useTorrentData будут добавлены здесь
  // Например, проверка обновления торрентов, обработка ошибок и т.д.
});
