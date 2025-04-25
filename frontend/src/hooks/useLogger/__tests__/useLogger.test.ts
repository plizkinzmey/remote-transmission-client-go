import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useLogger } from "../useLogger"; // Import from the hook file directly for testing

// Use vi.hoisted to define mocks before vi.mock runs
const { mockLogDebug, mockLogInfo, mockLogWarning, mockLogError } = vi.hoisted(
  () => {
    return {
      mockLogDebug: vi.fn(),
      mockLogInfo: vi.fn(),
      mockLogWarning: vi.fn(),
      mockLogError: vi.fn(),
    };
  }
);

// Mock the Wails runtime functions using the alias path
vi.mock("@wailsjs/runtime/runtime", () => ({
  LogDebug: mockLogDebug,
  LogInfo: mockLogInfo,
  LogWarning: mockLogWarning,
  LogError: mockLogError,
}));

describe("useLogger", () => {
  const testContext = "TestComponent";

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it("should return a logger object with debug, info, warn, and error methods", () => {
    const { result } = renderHook(() => useLogger(testContext));
    expect(result.current).toBeDefined();
    expect(result.current.debug).toBeInstanceOf(Function);
    expect(result.current.info).toBeInstanceOf(Function);
    expect(result.current.warn).toBeInstanceOf(Function);
    expect(result.current.error).toBeInstanceOf(Function);
  });

  it("should call LogDebug with formatted message", () => {
    const { result } = renderHook(() => useLogger(testContext));
    const message = "Debug message";
    result.current.debug(message);
    expect(mockLogDebug).toHaveBeenCalledTimes(1);
    expect(mockLogDebug).toHaveBeenCalledWith(`[${testContext}] ${message}`);
  });

  it("should call LogInfo with formatted message", () => {
    const { result } = renderHook(() => useLogger(testContext));
    const message = "Info message";
    result.current.info(message);
    expect(mockLogInfo).toHaveBeenCalledTimes(1);
    expect(mockLogInfo).toHaveBeenCalledWith(`[${testContext}] ${message}`);
  });

  it("should call LogWarning with formatted message", () => {
    const { result } = renderHook(() => useLogger(testContext));
    const message = "Warning message";
    result.current.warn(message);
    expect(mockLogWarning).toHaveBeenCalledTimes(1);
    expect(mockLogWarning).toHaveBeenCalledWith(`[${testContext}] ${message}`);
  });

  it("should call LogError with formatted message", () => {
    const { result } = renderHook(() => useLogger(testContext));
    const message = "Error message";
    result.current.error(message);
    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockLogError).toHaveBeenCalledWith(`[${testContext}] ${message}`);
  });

  it("should call log methods with formatted message including data", () => {
    const { result } = renderHook(() => useLogger(testContext));
    const message = "Data message";
    const data = { key: "value", count: 1 };
    const expectedFormattedMessage = `[${testContext}] ${message} ${JSON.stringify(
      data
    )}`;

    result.current.debug(message, data);
    expect(mockLogDebug).toHaveBeenCalledTimes(1);
    expect(mockLogDebug).toHaveBeenCalledWith(expectedFormattedMessage);

    result.current.info(message, data);
    expect(mockLogInfo).toHaveBeenCalledTimes(1);
    expect(mockLogInfo).toHaveBeenCalledWith(expectedFormattedMessage);

    result.current.warn(message, data);
    expect(mockLogWarning).toHaveBeenCalledTimes(1);
    expect(mockLogWarning).toHaveBeenCalledWith(expectedFormattedMessage);

    result.current.error(message, data);
    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockLogError).toHaveBeenCalledWith(expectedFormattedMessage);
  });
});
