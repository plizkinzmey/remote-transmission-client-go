import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useSettingsSaver } from "../useSettingsSaver";
import { SaveAllSettings } from "@wailsjs/go/main/App";
import { ConnectionConfig } from "@app/App";
import type { PathChanges } from "@app/types/settings";
import type { PathsTabRef } from "@components/Settings/PathsTab";

// Mock SaveAllSettings (relying on global mock from setup-tests.tsx)

// Mock useLocalization
vi.mock("@contexts/LocalizationContext", async () => {
  const actual = await vi.importActual("@contexts/LocalizationContext");
  return {
    ...actual,
    useLocalization: () => ({
      t: (key: string, params?: any) => {
        if (key === "errors.failedToInitializeConnection")
          return `Init failed: ${params?.[0]}`;
        if (key === "errors.failedToUpdateSettings")
          return `Update failed: ${params?.[0]}`;
        return key;
      },
      currentLanguage: "en",
      setLanguage: vi.fn(),
    }),
  };
});

const defaultSettings: ConnectionConfig = {
  host: "host",
  port: 9091,
  username: "user",
  password: "pw",
  maxUploadRatio: 1,
  slowSpeedLimit: 50,
  slowSpeedUnit: "KiB/s",
};

const mockPathChanges: PathChanges = {
  pathsToAdd: ["/new/path"],
  pathsToRemove: ["/old/path"],
  defaultPath: "/default/path",
};

describe("useSettingsSaver Hook", () => {
  let mockValidateSettings: Mock;
  let mockOnSaveSuccess: Mock;
  let mockOnSaveError: Mock;
  let mockOnConnectionInitNeeded: Mock;
  let mockPathsTabRef: React.RefObject<PathsTabRef>;

  beforeEach(() => {
    vi.clearAllMocks();
    (SaveAllSettings as Mock).mockResolvedValue(undefined);

    mockValidateSettings = vi.fn(() => true);
    mockOnSaveSuccess = vi.fn();
    mockOnSaveError = vi.fn();
    mockOnConnectionInitNeeded = vi.fn().mockResolvedValue(true);
    mockPathsTabRef = {
      current: {
        getPathChanges: vi.fn(() => mockPathChanges),
        resetChanges: vi.fn(),
        saveChanges: vi.fn(),
        hasChanges: true,
      },
    };
  });

  const getHookProps = (
    overrides: Partial<Parameters<typeof useSettingsSaver>[0]> = {}
  ) => ({
    settings: defaultSettings,
    validateSettings: mockValidateSettings,
    onSaveSuccess: mockOnSaveSuccess,
    onSaveError: mockOnSaveError,
    onConnectionInitNeeded: mockOnConnectionInitNeeded,
    pathsTabRef: mockPathsTabRef,
    hasPendingPathsChanges: false,
    isFirstStart: false,
    currentLanguage: "en",
    initialLanguage: "en",
    ...overrides,
  });

  it("initializes with isSaving=false", () => {
    const { result } = renderHook(() => useSettingsSaver(getHookProps()));
    expect(result.current.isSaving).toBe(false);
  });

  it("does not save if validation fails", async () => {
    mockValidateSettings.mockReturnValue(false);
    const { result } = renderHook(() => useSettingsSaver(getHookProps()));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.isSaving).toBe(false);
    expect(SaveAllSettings).not.toHaveBeenCalled();
    expect(mockOnSaveSuccess).not.toHaveBeenCalled();
    expect(mockOnSaveError).not.toHaveBeenCalled();
  });

  it("saves successfully in normal mode without path changes", async () => {
    const { result } = renderHook(() =>
      useSettingsSaver(getHookProps({ hasPendingPathsChanges: false }))
    );

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(mockValidateSettings).toHaveBeenCalledTimes(1);
    expect(SaveAllSettings).toHaveBeenCalledWith(defaultSettings, {
      pathsToAdd: [],
      pathsToRemove: [],
      defaultPath: null,
    });
    expect(mockOnSaveSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSaveError).not.toHaveBeenCalled();
    expect(mockOnConnectionInitNeeded).not.toHaveBeenCalled();
  });

  it("saves successfully in normal mode with path changes", async () => {
    const { result } = renderHook(() =>
      useSettingsSaver(getHookProps({ hasPendingPathsChanges: true }))
    );

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(mockValidateSettings).toHaveBeenCalledTimes(1);
    expect(mockPathsTabRef.current?.getPathChanges).toHaveBeenCalledTimes(1);
    expect(SaveAllSettings).toHaveBeenCalledWith(
      defaultSettings,
      mockPathChanges
    );
    expect(mockOnSaveSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSaveError).not.toHaveBeenCalled();
  });

  it("handles SaveAllSettings error in normal mode", async () => {
    const saveError = new Error("Save failed");
    (SaveAllSettings as Mock).mockRejectedValue(saveError);
    const { result } = renderHook(() => useSettingsSaver(getHookProps()));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.isSaving).toBe(false);
    expect(SaveAllSettings).toHaveBeenCalledTimes(1);
    expect(mockOnSaveSuccess).not.toHaveBeenCalled();
    expect(mockOnSaveError).toHaveBeenCalledWith(`Update failed: ${saveError}`);
    expect(mockOnConnectionInitNeeded).not.toHaveBeenCalled();
  });

  it('handles "service not initialized" error, retries after successful init', async () => {
    const initError = new Error("service not initialized");
    (SaveAllSettings as Mock).mockRejectedValueOnce(initError); // Fail first time
    const { result } = renderHook(() => useSettingsSaver(getHookProps()));

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(SaveAllSettings).toHaveBeenCalledTimes(2); // Called initially and on retry
    expect(mockOnConnectionInitNeeded).toHaveBeenCalledTimes(1);
    expect(mockOnSaveSuccess).toHaveBeenCalledTimes(1); // Should succeed on retry
    expect(mockOnSaveError).not.toHaveBeenCalled();
  });

  it('handles "service not initialized" error, calls error callback if init fails', async () => {
    const initError = new Error("service not initialized");
    const connectionInitFailError = new Error("Init failed");
    (SaveAllSettings as Mock).mockRejectedValueOnce(initError);
    mockOnConnectionInitNeeded.mockRejectedValueOnce(connectionInitFailError); // Make init fail
    const { result } = renderHook(() => useSettingsSaver(getHookProps()));

    await act(async () => {
      await result.current.handleSave();
    });

    expect(result.current.isSaving).toBe(false);
    expect(SaveAllSettings).toHaveBeenCalledTimes(1); // Only called initially
    expect(mockOnConnectionInitNeeded).toHaveBeenCalledTimes(1);
    expect(mockOnSaveSuccess).not.toHaveBeenCalled();
    expect(mockOnSaveError).toHaveBeenCalledWith(
      `Init failed: ${connectionInitFailError}`
    );
  });

  it("calls onConnectionInitNeeded directly on first start with language change", async () => {
    const { result } = renderHook(() =>
      useSettingsSaver(
        getHookProps({
          isFirstStart: true,
          currentLanguage: "ru",
          initialLanguage: "en",
        })
      )
    );

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(mockValidateSettings).toHaveBeenCalledTimes(1);
    expect(SaveAllSettings).not.toHaveBeenCalled(); // Should not call SaveAllSettings directly
    expect(mockOnConnectionInitNeeded).toHaveBeenCalledTimes(1);
    expect(mockOnSaveSuccess).toHaveBeenCalledTimes(1); // Called if init succeeds
    expect(mockOnSaveError).not.toHaveBeenCalled();
  });

  it("calls SaveAllSettings on first start without language change", async () => {
    const { result } = renderHook(() =>
      useSettingsSaver(
        getHookProps({
          isFirstStart: true,
          currentLanguage: "en",
          initialLanguage: "en",
        })
      )
    );

    await act(async () => {
      await result.current.handleSave();
    });

    await waitFor(() => {
      expect(result.current.isSaving).toBe(false);
    });

    expect(mockValidateSettings).toHaveBeenCalledTimes(1);
    expect(SaveAllSettings).toHaveBeenCalledTimes(1);
    expect(mockOnConnectionInitNeeded).not.toHaveBeenCalled();
    expect(mockOnSaveSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnSaveError).not.toHaveBeenCalled();
  });
});
