import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "../Footer";

// Мокируем хук локализации
vi.mock("../../../contexts/LocalizationContext", () => ({
  useLocalization: vi.fn().mockReturnValue({
    t: (key: string) => key,
    locale: "ru",
    setLocale: vi.fn(),
    isLoading: false,
  }),
}));

describe('Footer', () => {
  describe('Отображение состояний загрузки', () => {
    it('отображает все спиннеры при отсутствии данных', () => {
      render(<Footer />);
      expect(screen.getAllByTestId("loading-spinner")).toHaveLength(4);
    });

    it('отображает только спиннер версии при наличии остальных данных', () => {
      render(
        <Footer
          totalDownloadSpeed={1024}
          totalUploadSpeed={2048}
          freeSpace={1073741824}
        />
      );

      expect(screen.getAllByTestId("loading-spinner")).toHaveLength(1);
    });
  });

  describe('Форматирование скорости', () => {
    it('отображает нулевую скорость корректно', () => {
      render(
        <Footer
          totalDownloadSpeed={0}
          totalUploadSpeed={0}
          freeSpace={1024}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("download-speed-block")).toHaveTextContent("0.00 B/s");
      expect(screen.getByTestId("upload-speed-block")).toHaveTextContent("0.00 B/s");
    });

    it('корректно отображает отрицательные значения скорости как нулевые', () => {
      render(
        <Footer
          totalDownloadSpeed={-1024}
          totalUploadSpeed={-2048}
          freeSpace={1024}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("download-speed-block")).toHaveTextContent("0.00 B/s");
      expect(screen.getByTestId("upload-speed-block")).toHaveTextContent("0.00 B/s");
    });

    it('корректно форматирует разные единицы измерения скорости', () => {
      render(
        <Footer
          totalDownloadSpeed={1024 * 1024} // 1 MB/s
          totalUploadSpeed={1024} // 1 KB/s
          freeSpace={1024}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("download-speed-block")).toHaveTextContent("1.00 MB/s");
      expect(screen.getByTestId("upload-speed-block")).toHaveTextContent("1.00 KB/s");
    });

    it('корректно обрабатывает NaN значения скорости', () => {
      render(
        <Footer
          totalDownloadSpeed={NaN}
          totalUploadSpeed={NaN}
          freeSpace={1024}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("download-speed-block")).toHaveTextContent("0.00 B/s");
      expect(screen.getByTestId("upload-speed-block")).toHaveTextContent("0.00 B/s");
    });
  });

  describe('Форматирование размера диска', () => {
    it('отображает нулевой размер корректно', () => {
      render(
        <Footer
          totalDownloadSpeed={0}
          totalUploadSpeed={0}
          freeSpace={0}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("free-space-block")).toHaveTextContent("0.00 B");
    });

    it('корректно отображает отрицательные значения размера как нулевые', () => {
      render(
        <Footer
          totalDownloadSpeed={0}
          totalUploadSpeed={0}
          freeSpace={-1024}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("free-space-block")).toHaveTextContent("0.00 B");
    });

    it('корректно обрабатывает NaN значения размера', () => {
      render(
        <Footer
          totalDownloadSpeed={0}
          totalUploadSpeed={0}
          freeSpace={NaN}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("free-space-block")).toHaveTextContent("0.00 B");
    });
  });

  describe('Отображение версии', () => {
    it('отображает версию корректно', () => {
      render(
        <Footer
          totalDownloadSpeed={0}
          totalUploadSpeed={0}
          freeSpace={0}
          transmissionVersion="3.0.0-beta"
        />
      );

      expect(screen.getByTestId("version-block")).toHaveTextContent("3.0.0-beta");
    });
  });
});