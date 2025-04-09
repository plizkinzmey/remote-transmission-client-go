import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
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
  describe('Форматирование при отсутствии данных', () => {
    it('отображает спиннер при undefined скорости', () => {
      render(
        <Footer
          freeSpace={1024}
          transmissionVersion="3.0.0"
        />
      );

      const downloadBlock = screen.getByTestId("download-speed-block");
      const uploadBlock = screen.getByTestId("upload-speed-block");

      expect(downloadBlock.querySelector('[data-testid="loading-spinner"]')).toBeInTheDocument();
      expect(uploadBlock.querySelector('[data-testid="loading-spinner"]')).toBeInTheDocument();
    });

    it('отображает спиннер при undefined размере диска', () => {
      render(
        <Footer
          totalDownloadSpeed={1024}
          totalUploadSpeed={1024}
          transmissionVersion="3.0.0"
        />
      );

      const freeSpaceBlock = screen.getByTestId("free-space-block");
      expect(freeSpaceBlock.querySelector('[data-testid="loading-spinner"]')).toBeInTheDocument();
    });
  });

  describe('Форматирование скорости', () => {
    it('корректно форматирует скорость в разных единицах измерения', () => {
      render(
        <Footer
          totalDownloadSpeed={500}
          totalUploadSpeed={1500000}
          freeSpace={1073741824}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("download-speed-block")).toHaveTextContent("500.00 B/s");
      expect(screen.getByTestId("upload-speed-block")).toHaveTextContent("1.43 MB/s");
    });

    it('корректно форматирует нулевые значения', () => {
      render(
        <Footer
          totalDownloadSpeed={0}
          totalUploadSpeed={0}
          freeSpace={0}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("download-speed-block")).toHaveTextContent("0.00 B/s");
      expect(screen.getByTestId("upload-speed-block")).toHaveTextContent("0.00 B/s");
      expect(screen.getByTestId("free-space-block")).toHaveTextContent("0.00 B");
    });

    it('корректно форматирует большие значения скорости', () => {
      render(
        <Footer
          totalDownloadSpeed={1073741824} // 1 GB/s
          totalUploadSpeed={1073741824}
          freeSpace={1073741824}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("download-speed-block")).toHaveTextContent("1.00 GB/s");
      expect(screen.getByTestId("upload-speed-block")).toHaveTextContent("1.00 GB/s");
    });
  });

  describe('Отображение версии', () => {
    it('отображает спиннер при отсутствии версии', () => {
      render(
        <Footer
          totalDownloadSpeed={1024}
          totalUploadSpeed={1024}
          freeSpace={1024}
        />
      );

      const versionBlock = screen.getByTestId("version-block");
      expect(versionBlock.querySelector('[data-testid="loading-spinner"]')).toBeInTheDocument();
    });

    it('корректно отображает версию при её наличии', () => {
      render(
        <Footer
          totalDownloadSpeed={1024}
          totalUploadSpeed={1024}
          freeSpace={1024}
          transmissionVersion="3.0.0"
        />
      );

      expect(screen.getByTestId("version-block")).toHaveTextContent("3.0.0");
    });
  });
});