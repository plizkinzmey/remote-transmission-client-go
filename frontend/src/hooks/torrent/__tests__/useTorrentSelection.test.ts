import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTorrentSelection } from "../useTorrentSelection";
import { TorrentData } from "../types"; // Импортируем тип

// Фиктивные данные для тестов
const mockTorrents: TorrentData[] = [
  { ID: 1, Name: "Torrent 1" } as TorrentData,
  { ID: 2, Name: "Torrent 2" } as TorrentData,
  { ID: 3, Name: "Torrent 3" } as TorrentData,
];

describe("useTorrentSelection", () => {
  it("should initialize with an empty selection", () => {
    const { result } = renderHook(() => useTorrentSelection());
    expect(result.current.selectedTorrents.size).toBe(0);
    expect(result.current.hasSelectedTorrents).toBe(false);
  });

  it("should select a torrent when handleTorrentSelect is called", () => {
    const { result } = renderHook(() => useTorrentSelection());
    act(() => {
      result.current.handleTorrentSelect(1);
    });
    expect(result.current.selectedTorrents.has(1)).toBe(true);
    expect(result.current.selectedTorrents.size).toBe(1);
    expect(result.current.hasSelectedTorrents).toBe(true);
  });

  it("should deselect a torrent when handleTorrentSelect is called on a selected torrent", () => {
    const { result } = renderHook(() => useTorrentSelection());
    act(() => {
      result.current.handleTorrentSelect(1); // Select
    });
    act(() => {
      result.current.handleTorrentSelect(1); // Deselect
    });
    expect(result.current.selectedTorrents.has(1)).toBe(false);
    expect(result.current.selectedTorrents.size).toBe(0);
    expect(result.current.hasSelectedTorrents).toBe(false);
  });

  it("should select multiple torrents", () => {
    const { result } = renderHook(() => useTorrentSelection());
    act(() => {
      result.current.handleTorrentSelect(1);
    });
    act(() => {
      result.current.handleTorrentSelect(2);
    });
    expect(result.current.selectedTorrents.has(1)).toBe(true);
    expect(result.current.selectedTorrents.has(2)).toBe(true);
    expect(result.current.selectedTorrents.size).toBe(2);
    expect(result.current.hasSelectedTorrents).toBe(true);
  });

  it("should select all filtered torrents when handleSelectAll is called", () => {
    const { result } = renderHook(() => useTorrentSelection());
    act(() => {
      result.current.handleSelectAll(mockTorrents);
    });
    expect(result.current.selectedTorrents.size).toBe(mockTorrents.length);
    expect(result.current.selectedTorrents.has(1)).toBe(true);
    expect(result.current.selectedTorrents.has(2)).toBe(true);
    expect(result.current.selectedTorrents.has(3)).toBe(true);
    expect(result.current.hasSelectedTorrents).toBe(true);
  });

  it("should deselect all torrents when handleSelectAll is called and all are already selected", () => {
    const { result } = renderHook(() => useTorrentSelection());
    // Select all first
    act(() => {
      result.current.handleSelectAll(mockTorrents);
    });
    // Call again to deselect
    act(() => {
      result.current.handleSelectAll(mockTorrents);
    });
    expect(result.current.selectedTorrents.size).toBe(0);
    expect(result.current.hasSelectedTorrents).toBe(false);
  });

  it("should select all filtered torrents when handleSelectAll is called and some are selected", () => {
    const { result } = renderHook(() => useTorrentSelection());
    // Select one first
    act(() => {
      result.current.handleTorrentSelect(1);
    });
    // Call select all
    act(() => {
      result.current.handleSelectAll(mockTorrents);
    });
    expect(result.current.selectedTorrents.size).toBe(mockTorrents.length);
    expect(result.current.hasSelectedTorrents).toBe(true);
  });

  it("should clear selection when clearSelection is called", () => {
    const { result } = renderHook(() => useTorrentSelection());
    act(() => {
      result.current.handleTorrentSelect(1);
      result.current.handleTorrentSelect(2);
    });
    expect(result.current.selectedTorrents.size).toBe(2);
    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedTorrents.size).toBe(0);
    expect(result.current.hasSelectedTorrents).toBe(false);
  });

  it("should handle empty filteredTorrents array in handleSelectAll", () => {
    const { result } = renderHook(() => useTorrentSelection());
    act(() => {
      result.current.handleSelectAll([]);
    });
    expect(result.current.selectedTorrents.size).toBe(0);
    expect(result.current.hasSelectedTorrents).toBe(false);
  });
});
