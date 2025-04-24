import { describe, it, expect } from "vitest";
import {
  StatusType,
  ColorType,
  isRunning,
  isChecking,
  isQueued,
  isBlocked,
  getStatusData,
  getCardClassName,
  mapBackendStatusToFrontend,
} from "../torrentStatus";

// Определим все возможные статусы для удобства тестирования
const allStatuses: StatusType[] = [
  "downloading",
  "seeding",
  "stopped",
  "completed",
  "checking",
  "queuedCheck",
  "queuedDownload",
  "queued",
  "error", // <-- Добавляем статус ошибки
];

describe("isRunning", () => {
  it("should return true for downloading and seeding statuses", () => {
    expect(isRunning("downloading")).toBe(true);
    expect(isRunning("seeding")).toBe(true);
  });

  it("should return false for other statuses", () => {
    expect(isRunning("stopped")).toBe(false);
    expect(isRunning("checking")).toBe(false);
    expect(isRunning("queued")).toBe(false);
    expect(isRunning("completed")).toBe(false);
    expect(isRunning("error")).toBe(false);
  });
});

describe("isChecking", () => {
  it("should return true for checking status", () => {
    expect(isChecking("checking")).toBe(true);
  });

  it("should return false for other statuses", () => {
    expect(isChecking("downloading")).toBe(false);
    expect(isChecking("seeding")).toBe(false);
    expect(isChecking("stopped")).toBe(false);
    expect(isChecking("queued")).toBe(false);
    expect(isChecking("completed")).toBe(false);
    expect(isChecking("error")).toBe(false);
  });
});

describe("isQueued", () => {
  it("should return true for queued statuses", () => {
    expect(isQueued("queuedCheck")).toBe(true);
    expect(isQueued("queuedDownload")).toBe(true);
    expect(isQueued("queued")).toBe(true);
  });

  it("should return false for other statuses", () => {
    expect(isQueued("downloading")).toBe(false);
    expect(isQueued("seeding")).toBe(false);
    expect(isQueued("stopped")).toBe(false);
    expect(isQueued("checking")).toBe(false);
    expect(isQueued("completed")).toBe(false);
    expect(isQueued("error")).toBe(false);
  });
});

describe("isBlocked", () => {
  it("должен возвращать true для статусов проверки, очереди и ошибки", () => {
    expect(isBlocked("checking")).toBe(true);
    expect(isBlocked("queuedCheck")).toBe(true);
    expect(isBlocked("queuedDownload")).toBe(true);
    expect(isBlocked("queued")).toBe(true);
    expect(isBlocked("error")).toBe(true); // <-- Добавляем тест для ошибки
  });

  it("должен возвращать false для активных и остановленных/завершенных статусов", () => {
    expect(isBlocked("downloading")).toBe(false);
    expect(isBlocked("seeding")).toBe(false);
    expect(isBlocked("stopped")).toBe(false);
    expect(isBlocked("completed")).toBe(false);
  });
});

describe("getStatusData", () => {
  const expectedColors: Record<StatusType, ColorType> = {
    downloading: "blue",
    seeding: "grass",
    completed: "mint",
    checking: "amber",
    queued: "purple",
    queuedCheck: "purple",
    queuedDownload: "purple",
    stopped: "gray",
    error: "tomato", // <-- Добавляем цвет для ошибки
  };

  allStatuses.forEach((status) => {
    it(`должен возвращать правильный цвет для статуса '${status}'`, () => {
      expect(getStatusData(status)).toEqual({ color: expectedColors[status] });
    });
  });

  it("должен возвращать 'gray' для неизвестного статуса (хотя тип StatusType это предотвращает)", () => {
    // Этот тест больше для проверки логики fallback, хотя с StatusType он менее вероятен
    expect(getStatusData("unknownStatus" as any)).toEqual({ color: "gray" });
  });
});

describe("getCardClassName", () => {
  const mockStyles = {
    cardBase: "base-class-hash",
    cardDownloading: "downloading-class-hash",
    cardSeeding: "seeding-class-hash",
    cardStopped: "stopped-class-hash",
    cardCompleted: "completed-class-hash",
    cardChecking: "checking-class-hash",
    cardQueuedCheck: "queued-check-class-hash",
    cardQueuedDownload: "queued-download-class-hash",
    cardQueued: "queued-class-hash",
    cardError: "error-class-hash", // <-- Добавляем класс для ошибки
  };

  allStatuses.forEach((status) => {
    it(`должен возвращать правильные классы для статуса '${status}'`, () => {
      const statusCapitalized =
        status.charAt(0).toUpperCase() + status.slice(1);
      const expectedStatusClassKey =
        `card${statusCapitalized}` as keyof typeof mockStyles;
      const expectedStatusClass = mockStyles[expectedStatusClassKey] || "";
      const expectedResult =
        `${mockStyles.cardBase} ${expectedStatusClass}`.trim();
      expect(getCardClassName(status, "cardBase", mockStyles)).toBe(
        expectedResult
      );
    });
  });

  it("должен возвращать только базовый класс, если класс статуса отсутствует в стилях", () => {
    const stylesWithoutStatus = { cardBase: "base-class-hash" };
    expect(
      getCardClassName("downloading", "cardBase", stylesWithoutStatus)
    ).toBe(mockStyles.cardBase);
  });

  it("должен возвращать КЛАСС СТАТУСА, если базовый класс отсутствует", () => {
    const stylesWithoutBase = { cardDownloading: "downloading-class-hash" };
    expect(
      getCardClassName("downloading", "nonExistentBase", stylesWithoutBase)
    ).toBe(mockStyles.cardDownloading);
  });

  it("должен возвращать класс статуса, если базовый класс отсутствует, но класс статуса есть", () => {
    const stylesWithoutBase = { cardDownloading: "downloading-class-hash" };
    expect(
      getCardClassName("downloading", "nonExistentBase", stylesWithoutBase)
    ).toBe(mockStyles.cardDownloading);
  });

  it("должен возвращать пустую строку, если оба класса отсутствуют", () => {
    const emptyStyles = {};
    expect(
      getCardClassName("downloading", "nonExistentBase", emptyStyles)
    ).toBe("");
  });
});

describe("mapBackendStatusToFrontend", () => {
  // Тестируем известные валидные строковые статусы
  const validStatuses: StatusType[] = [
    "downloading",
    "seeding",
    "stopped",
    "completed",
    "checking",
    "queuedCheck",
    "queuedDownload",
    "queued",
  ];

  validStatuses.forEach((status) => {
    it(`должен возвращать "${status}" для входного значения "${status}"`, () => {
      expect(mapBackendStatusToFrontend(status)).toBe(status);
    });
  });

  // Тестируем невалидные строковые статусы
  it("должен возвращать 'error' для неизвестных строковых статусов", () => {
    expect(mapBackendStatusToFrontend("unknown")).toBe("error");
    expect(mapBackendStatusToFrontend("7")).toBe("error"); // Пример числовой строки
    expect(mapBackendStatusToFrontend("")).toBe("error"); // Пустая строка
  });

  // Тестируем null и undefined
  it("должен возвращать 'error' для null и undefined", () => {
    expect(mapBackendStatusToFrontend(null)).toBe("error");
    expect(mapBackendStatusToFrontend(undefined)).toBe("error");
  });
});
