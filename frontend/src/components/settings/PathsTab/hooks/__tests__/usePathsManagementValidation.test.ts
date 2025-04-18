import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { usePathsManagement } from "../usePathsManagement";

// Моки Wails и локализации
const mockValidateDownloadPath = vi.fn();
const mockT = vi.fn((key) => key);
vi.mock("../../../../../contexts/LocalizationContext", () => ({
  useLocalization: () => ({ t: mockT }),
}));
vi.mock("../../../../../../wailsjs/go/main/App", () => ({
  ValidateDownloadPath: (path: string) => mockValidateDownloadPath(path),
}));

describe("usePathsManagement - Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateDownloadPath.mockResolvedValue(undefined);
  });

  it("успешная валидация нового пути", async () => {
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    act(() => result.current.setNewPathValue("/valid/path"));
    let valid = false;
    await act(async () => {
      valid = await result.current.validateNewPath();
    });

    expect(mockValidateDownloadPath).toHaveBeenCalledWith("/valid/path");
    expect(valid).toBe(true);
    expect(result.current.pathError).toBe("");
  });

  it("обработка ошибки валидации пути", async () => {
    const error = new Error("Invalid");
    mockValidateDownloadPath.mockRejectedValue(error);
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    act(() => result.current.setNewPathValue("/invalid"));
    let valid = true;
    await act(async () => {
      valid = await result.current.validateNewPath();
    });

    expect(mockValidateDownloadPath).toHaveBeenCalledWith("/invalid");
    expect(valid).toBe(false);
    expect(result.current.pathError).toBe("Invalid");
  });

  it("валидация пустого или пробельного пути", async () => {
    const { result, rerender } = renderHook(() => usePathsManagement({}));
    await act(async () => {
      rerender();
    });
    await act(async () => {});

    act(() => result.current.setNewPathValue(" "));
    let valid = true;
    await act(async () => {
      valid = await result.current.validateNewPath();
    });

    expect(mockValidateDownloadPath).not.toHaveBeenCalled();
    expect(valid).toBe(false);
    expect(result.current.pathError).toBe("settings.pathRequired");
    expect(mockT).toHaveBeenCalledWith("settings.pathRequired");
  });
});
