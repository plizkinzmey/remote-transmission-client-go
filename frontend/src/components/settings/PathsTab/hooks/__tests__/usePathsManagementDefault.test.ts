import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { usePathsManagement } from "../usePathsManagement";

// Моки Wails и локализации
const mockGetDownloadPaths = vi.fn();
const mockGetDefaultDownloadDir = vi.fn();
const mockValidateDownloadPath = vi.fn();
const mockSavePathsChanges = vi.fn();
const mockGetPathsState = vi.fn();
const mockT = vi.fn((key) => key);
vi.mock("../../../contexts/LocalizationContext", () => ({
  useLocalization: () => ({ t: mockT }),
}));
vi.mock("../../../../wailsjs/go/main/App", () => ({
  GetDownloadPaths: () => mockGetDownloadPaths(),
  GetDefaultDownloadDir: () => mockGetDefaultDownloadDir(),
  ValidateDownloadPath: (p: string) => mockValidateDownloadPath(p),
  SavePathsChanges: (a: string[], b: string[], c: string) =>
    mockSavePathsChanges(a, b, c),
  GetPathsState: () => mockGetPathsState(),
}));

describe("usePathsManagement - Default Path", () => {
  const initial = ["/d1", "/d2"];
  const initialDefault = "/d1";
  const systemDefault = "/d1";

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGetDefaultDownloadDir.mockResolvedValue(systemDefault);
    mockGetDownloadPaths.mockResolvedValue(initial);
    mockValidateDownloadPath.mockResolvedValue(undefined);
    mockSavePathsChanges.mockResolvedValue(undefined);
    mockGetPathsState.mockResolvedValue({
      paths: initial,
      defaultPath: initialDefault,
    });
  });

  it("должен устанавливать новый путь по умолчанию", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const newDef = initial[1];
    act(() => result.current.handleSetDefaultPath(newDef));

    expect(result.current.defaultPath).toBe(newDef);
    expect(result.current.getPathChanges().defaultPath).toBe(newDef);
    expect(result.current.hasChanges).toBe(true);
    expect(onPathsChanged).toHaveBeenCalledWith(true);
  });

  it("не должен менять тот же путь по умолчанию", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const curr = result.current.defaultPath;
    act(() => result.current.handleSetDefaultPath(curr));

    expect(result.current.getPathChanges().defaultPath).toBeNull();
    expect(result.current.hasChanges).toBe(false);
    onPathsChanged.mockClear();
    act(() => result.current.handleSetDefaultPath(curr));
    expect(onPathsChanged).not.toHaveBeenCalled();
  });

  it("сбрасывает изменение default при возврате к исходному", async () => {
    const onPathsChanged = vi.fn();
    const { result, rerender } = renderHook(() =>
      usePathsManagement({ onPathsChanged })
    );
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    const orig = result.current.defaultPath;
    const newDef = initial[1];

    act(() => result.current.handleSetDefaultPath(newDef));
    expect(result.current.getPathChanges().defaultPath).toBe(newDef);
    onPathsChanged.mockClear();

    act(() => result.current.handleSetDefaultPath(orig));
    expect(result.current.defaultPath).toBe(orig);
    expect(result.current.getPathChanges().defaultPath).toBeNull();
    expect(result.current.hasChanges).toBe(false);
    expect(onPathsChanged).toHaveBeenCalledWith(false);
  });
});
