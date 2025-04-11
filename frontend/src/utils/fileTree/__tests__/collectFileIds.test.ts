import { describe, it, expect } from "vitest";
import { collectFileIds } from "../collectFileIds";
import { FileNode } from "../../../types/FileTree";

describe("collectFileIds", () => {
  it("возвращает ID одиночного файла", () => {
    const node: FileNode = {
      ID: 1,
      Name: "file.txt",
      Path: "file.txt",
      Size: 100,
      Progress: 0,
      Wanted: true,
      isDirectory: false,
    };

    const result = collectFileIds(node);
    expect(result).toEqual([1]);
  });

  it("возвращает пустой массив для директории без файлов", () => {
    const node: FileNode = {
      ID: -1,
      Name: "empty-dir",
      Path: "empty-dir",
      Size: 0,
      Progress: 0,
      Wanted: false,
      isDirectory: true,
      children: [],
    };

    const result = collectFileIds(node);
    expect(result).toEqual([]);
  });

  it("собирает ID всех файлов из директории", () => {
    const node: FileNode = {
      ID: -1,
      Name: "dir",
      Path: "dir",
      Size: 300,
      Progress: 0,
      Wanted: false,
      isDirectory: true,
      children: [
        {
          ID: 1,
          Name: "file1.txt",
          Path: "dir/file1.txt",
          Size: 100,
          Progress: 0,
          Wanted: true,
          isDirectory: false,
        },
        {
          ID: 2,
          Name: "file2.txt",
          Path: "dir/file2.txt",
          Size: 200,
          Progress: 0,
          Wanted: true,
          isDirectory: false,
        },
      ],
    };

    const result = collectFileIds(node);
    expect(result).toEqual([1, 2]);
  });

  it("рекурсивно собирает ID из вложенных директорий", () => {
    const node: FileNode = {
      ID: -1,
      Name: "root",
      Path: "root",
      Size: 600,
      Progress: 0,
      Wanted: false,
      isDirectory: true,
      children: [
        {
          ID: 1,
          Name: "file1.txt",
          Path: "root/file1.txt",
          Size: 100,
          Progress: 0,
          Wanted: true,
          isDirectory: false,
        },
        {
          ID: -1,
          Name: "subdir",
          Path: "root/subdir",
          Size: 500,
          Progress: 0,
          Wanted: false,
          isDirectory: true,
          children: [
            {
              ID: 2,
              Name: "file2.txt",
              Path: "root/subdir/file2.txt",
              Size: 200,
              Progress: 0,
              Wanted: true,
              isDirectory: false,
            },
            {
              ID: 3,
              Name: "file3.txt",
              Path: "root/subdir/file3.txt",
              Size: 300,
              Progress: 0,
              Wanted: true,
              isDirectory: false,
            },
          ],
        },
      ],
    };

    const result = collectFileIds(node);
    expect(result).toEqual([1, 2, 3]);
  });

  it("игнорирует файлы с отрицательными ID", () => {
    const node: FileNode = {
      ID: -1,
      Name: "dir",
      Path: "dir",
      Size: 300,
      Progress: 0,
      Wanted: false,
      isDirectory: true,
      children: [
        {
          ID: -2, // Отрицательный ID
          Name: "invalid-file.txt",
          Path: "dir/invalid-file.txt",
          Size: 100,
          Progress: 0,
          Wanted: true,
          isDirectory: false,
        },
        {
          ID: 2,
          Name: "file2.txt",
          Path: "dir/file2.txt",
          Size: 200,
          Progress: 0,
          Wanted: true,
          isDirectory: false,
        },
      ],
    };

    const result = collectFileIds(node);
    expect(result).toEqual([2]);
  });
});
