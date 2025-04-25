import React from "react";
import { render, screen, fireEvent, createEvent } from "@testing-library/react";
import { DragDropProvider } from "../DragDropProvider";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

// Mock для локализации
vi.mock("../../../contexts/LocalizationContext", () => ({
  useLocalization: () => ({
    t: (key: string) => key,
    locale: "ru",
    setLocale: vi.fn(),
    isLoading: false
  }),
}));

describe('DragDropProvider', () => {
  // Сохраняем оригинальную реализацию FileReader
  const OriginalFileReader = window.FileReader;

  // Настраиваем мок перед тестами
  beforeEach(() => {
    const fileReaderMock = {
      readAsDataURL: vi.fn(),
      onload: null as any,
      result: "data:application/x-bittorrent;base64,mockBase64Content"
    };

    // Заменяем глобальный FileReader
    window.FileReader = vi.fn(() => fileReaderMock) as any;
  });

  // Восстанавливаем оригинал после тестов
  afterEach(() => {
    window.FileReader = OriginalFileReader;
    vi.clearAllMocks();
  });

  it('отображает контейнер без оверлея при первом рендеринге', () => {
    render(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    expect(screen.getByTestId('drag-drop-container')).toBeInTheDocument();
    expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
  });

  it('отображает оверлей при перетаскивании файла', () => {
    render(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    const container = screen.getByTestId('drag-drop-container');

    // Симулируем событие dragOver
    fireEvent.dragOver(container);

    // Проверяем, что оверлей отображается
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('drop-indicator')).toBeInTheDocument();
    expect(screen.getByText('add.dropTorrentHere')).toBeInTheDocument();
  });

  it('сохраняет оверлей при перетаскивании внутри контейнера', () => {
    render(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    const container = screen.getByTestId('drag-drop-container');

    // Симулируем событие dragOver
    fireEvent.dragOver(container);

    // Проверяем, что оверлей отображается
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();

    // Мокаем getBoundingClientRect для имитации положения курсора внутри контейнера
    const rect = { left: 100, right: 200, top: 100, bottom: 200 };
    container.getBoundingClientRect = vi.fn().mockReturnValue(rect);

    // Симулируем событие dragLeave с координатами внутри контейнера
    fireEvent.dragLeave(container, {
      clientX: 150, // Внутри контейнера по X (между left = 100 и right = 200)
      clientY: 150  // Внутри контейнера по Y (между top = 100 и bottom = 200)
    });

    // Проверяем, что оверлей все еще отображается
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();
  });

  it('скрывает оверлей при выходе курсора за левую границу', () => {
    const { rerender } = render(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    const container = screen.getByTestId('drag-drop-container');

    // Показываем оверлей
    fireEvent.dragOver(container);
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();

    // Мокаем getBoundingClientRect
    const rect = { left: 100, right: 200, top: 100, bottom: 200 };
    container.getBoundingClientRect = vi.fn().mockReturnValue(rect);

    // Симулируем выход курсора за левую границу
    const dragLeaveEvent = createEvent.dragLeave(container);
    Object.defineProperty(dragLeaveEvent, 'clientX', { value: 50 }); // Меньше чем left = 100
    Object.defineProperty(dragLeaveEvent, 'clientY', { value: 150 }); // Внутри по Y

    fireEvent(container, dragLeaveEvent);

    // Принудительно вызываем перерисовку для обновления состояния
    rerender(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    // Проверяем, что оверлей скрыт
    expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
  });

  it('скрывает оверлей при выходе курсора за правую границу', () => {
    const { rerender } = render(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    const container = screen.getByTestId('drag-drop-container');

    // Показываем оверлей
    fireEvent.dragOver(container);
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();

    // Мокаем getBoundingClientRect
    const rect = { left: 100, right: 200, top: 100, bottom: 200 };
    container.getBoundingClientRect = vi.fn().mockReturnValue(rect);

    // Симулируем выход курсора за правую границу
    const dragLeaveEvent = createEvent.dragLeave(container);
    Object.defineProperty(dragLeaveEvent, 'clientX', { value: 250 }); // Больше чем right = 200
    Object.defineProperty(dragLeaveEvent, 'clientY', { value: 150 }); // Внутри по Y

    fireEvent(container, dragLeaveEvent);

    // Принудительно вызываем перерисовку для обновления состояния
    rerender(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    // Проверяем, что оверлей скрыт
    expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
  });

  it('скрывает оверлей при выходе курсора за верхнюю границу', () => {
    const { rerender } = render(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    const container = screen.getByTestId('drag-drop-container');

    // Показываем оверлей
    fireEvent.dragOver(container);
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();

    // Мокаем getBoundingClientRect
    const rect = { left: 100, right: 200, top: 100, bottom: 200 };
    container.getBoundingClientRect = vi.fn().mockReturnValue(rect);

    // Симулируем выход курсора за верхнюю границу
    const dragLeaveEvent = createEvent.dragLeave(container);
    Object.defineProperty(dragLeaveEvent, 'clientX', { value: 150 }); // Внутри по X
    Object.defineProperty(dragLeaveEvent, 'clientY', { value: 50 }); // Меньше чем top = 100

    fireEvent(container, dragLeaveEvent);

    // Принудительно вызываем перерисовку для обновления состояния
    rerender(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    // Проверяем, что оверлей скрыт
    expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
  });

  it('скрывает оверлей при выходе курсора за нижнюю границу', () => {
    const { rerender } = render(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    const container = screen.getByTestId('drag-drop-container');

    // Показываем оверлей
    fireEvent.dragOver(container);
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();

    // Мокаем getBoundingClientRect
    const rect = { left: 100, right: 200, top: 100, bottom: 200 };
    container.getBoundingClientRect = vi.fn().mockReturnValue(rect);

    // Симулируем выход курсора за нижнюю границу
    const dragLeaveEvent = createEvent.dragLeave(container);
    Object.defineProperty(dragLeaveEvent, 'clientX', { value: 150 }); // Внутри по X
    Object.defineProperty(dragLeaveEvent, 'clientY', { value: 250 }); // Больше чем bottom = 200

    fireEvent(container, dragLeaveEvent);

    // Принудительно вызываем перерисовку для обновления состояния
    rerender(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    // Проверяем, что оверлей скрыт
    expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
  });

  it('скрывает оверлей при сбросе файла', () => {
    render(
      <DragDropProvider onFileDropped={vi.fn()}>
        <div>Test content</div>
      </DragDropProvider>
    );

    const container = screen.getByTestId('drag-drop-container');

    // Симулируем событие dragOver, чтобы отобразить оверлей
    fireEvent.dragOver(container);

    // Проверяем, что оверлей отображается
    expect(screen.getByTestId('drag-overlay')).toBeInTheDocument();

    // Симулируем сброс файла
    fireEvent.drop(container, {
      dataTransfer: {
        files: []
      }
    });

    // Проверяем, что оверлей скрыт
    expect(screen.queryByTestId('drag-overlay')).not.toBeInTheDocument();
  });

  it('обрабатывает сброс торрент-файла', () => {
    const onFileDroppedMock = vi.fn();

    render(
      <DragDropProvider onFileDropped={onFileDroppedMock}>
        <div>Test content</div>
      </DragDropProvider>
    );

    const container = screen.getByTestId('drag-drop-container');

    // Создаем mock-файл
    const file = new File(['content'], 'test.torrent', { type: 'application/x-bittorrent' });

    // Симулируем событие drop
    fireEvent.drop(container, {
      dataTransfer: {
        files: [file]
      }
    });

    // Находим созданный FileReader и симулируем событие onload
    const mockReader = (window.FileReader as unknown as ReturnType<typeof vi.fn>)();
    if (mockReader.onload) {
      mockReader.onload({ target: mockReader });
    }

    // Проверяем, что функция onFileDropped была вызвана с правильными параметрами
    expect(onFileDroppedMock).toHaveBeenCalledWith('test.torrent', 'mockBase64Content');
  });

  it('игнорирует файлы не формата .torrent', () => {
    const onFileDroppedMock = vi.fn();

    render(
      <DragDropProvider onFileDropped={onFileDroppedMock}>
        <div>Test content</div>
      </DragDropProvider>
    );

    const container = screen.getByTestId('drag-drop-container');

    // Создаем mock-файл не торрент-формата
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    // Симулируем событие drop
    fireEvent.drop(container, {
      dataTransfer: {
        files: [file]
      }
    });

    // Проверяем, что FileReader не был создан и функция onFileDropped не вызывалась
    expect(window.FileReader).not.toHaveBeenCalled();
    expect(onFileDroppedMock).not.toHaveBeenCalled();
  });
});