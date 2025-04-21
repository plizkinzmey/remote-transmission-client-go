import { vi, beforeEach } from "vitest";
import * as App from "@wailsjs/go/main/App";
import { domain } from "@wailsjs/go/models";
import * as LocalizationContext from "@contexts/LocalizationContext";
import * as buildFileTreeUtil from "@utils/fileTree/buildFileTree";
import * as collectFileIdsUtil from "@utils/fileTree/collectFileIds";
import * as updateNodesWantedUtil from "@utils/fileTree/updateNodesWanted";
import { FileNode } from "types/FileTree";

// --- Mocks ---
vi.mock("@wailsjs/go/main/App", () => ({
  GetTorrentFiles: vi.fn(),
  SetFilesWanted: vi.fn(),
}));
vi.mock("@contexts/LocalizationContext", () => ({
  useLocalization: vi.fn(),
}));
vi.mock("@utils/fileTree/buildFileTree");
vi.mock("@utils/fileTree/collectFileIds");
vi.mock("@utils/fileTree/updateNodesWanted");

export const mockGetTorrentFiles = vi.mocked(App.GetTorrentFiles);
export const mockSetFilesWanted = vi.mocked(App.SetFilesWanted);
export const mockUseLocalization = vi.mocked(
  LocalizationContext.useLocalization
);
export const mockBuildFileTree = vi.mocked(buildFileTreeUtil.buildFileTree);
export const mockCollectFileIds = vi.mocked(collectFileIdsUtil.collectFileIds);
export const mockUpdateNodesWanted = vi.mocked(
  updateNodesWantedUtil.updateNodesWanted
);

// --- Test Data ---
export const torrentId = 1;
export const mockRawFiles: domain.TorrentFile[] = [
  {
    ID: 0,
    Name: "file1.txt",
    Size: 100,
    Wanted: true,
    Path: "file1.txt",
    Progress: 100,
  },
  {
    ID: 1,
    Name: "folder/file2.iso",
    Size: 200,
    Wanted: false,
    Path: "folder/file2.iso",
    Progress: 0,
  },
  {
    ID: 2,
    Name: "folder/subfolder/file3.mkv",
    Size: 300,
    Wanted: true,
    Path: "folder/subfolder/file3.mkv",
    Progress: 100,
  },
];

export const mockFileTreeInitial: FileNode[] = [
  {
    ID: 0,
    Name: "file1.txt",
    Size: 100,
    Wanted: true,
    isDirectory: false,
    Path: "file1.txt",
    Progress: 100,
  },
  {
    ID: -1,
    Name: "folder",
    isDirectory: true,
    Path: "folder",
    Size: 500,
    Wanted: true,
    Progress: 60,
    indeterminate: true, // <-- должно быть true!
    children: [
      {
        ID: 1,
        Name: "file2.iso",
        Size: 200,
        Wanted: false, // <-- хотя бы один файл должен быть false
        isDirectory: false,
        Path: "folder/file2.iso",
        Progress: 0,
      },
      {
        ID: -2,
        Name: "subfolder",
        isDirectory: true,
        Path: "folder/subfolder",
        Size: 300,
        Wanted: true,
        Progress: 100,
        indeterminate: false,
        children: [
          {
            ID: 2,
            Name: "file3.mkv",
            Size: 300,
            Wanted: true,
            isDirectory: false,
            Path: "folder/subfolder/file3.mkv",
            Progress: 100,
          },
        ],
      },
    ],
  },
];

// --- Helper ---
export const findNodeByPath = (
  nodes: FileNode[] | undefined | null,
  path: string
): FileNode | null => {
  if (!nodes || !Array.isArray(nodes)) return null;

  for (const node of nodes) {
    if (node.Path === path) return node;
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

// --- Setup ---
export const setupCommonMocks = () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseLocalization.mockReturnValue({
      // Исправляем обработку одного аргумента
      t: (key: string, ...args: any[]) => {
        if (args.length === 1) {
          return `${key}:${args[0]}`; // Используем двоеточие для одного аргумента
        }
        if (args.length > 1) {
          return `${key}:${args.join(",")}`; // Оставляем запятую для нескольких
        }
        return key; // Без аргументов
      },
      setLanguage: vi.fn(),
      currentLanguage: "en",
      availableLanguages: [
        { code: "en", name: "English" },
        { code: "ru", name: "Russian" },
      ],
      isLoading: false,
    });

    // Устанавливаем мок GetTorrentFiles по умолчанию
    mockGetTorrentFiles.mockResolvedValue([...mockRawFiles]);

    // НЕ УСТАНАВЛИВАЕМ mockBuildFileTree здесь по умолчанию
    // mockBuildFileTree.mockImplementation((data) => {
    //   return JSON.parse(JSON.stringify(mockFileTreeInitial));
    // });

    mockCollectFileIds.mockImplementation((node) => {
      const ids: number[] = [];
      const collect = (n: FileNode) => {
        if (!n.isDirectory && n.ID !== undefined && n.ID >= 0) ids.push(n.ID);
        if (n.children) n.children.forEach(collect);
      };
      if (Array.isArray(node)) {
        node.forEach(collect);
      } else if (node) {
        collect(node);
      }
      return ids;
    });
    mockUpdateNodesWanted.mockImplementation(
      (tree, nodeToUpdate, wanted, fileIds) => {
        const newTree = JSON.parse(JSON.stringify(tree));

        const updateNodes = (nodes: FileNode[]): FileNode[] => {
          return nodes.map((node) => {
            const newNode = { ...node };

            if (
              node.Path === nodeToUpdate.Path ||
              fileIds.includes(node.ID) ||
              (node.isDirectory &&
                nodeToUpdate.isDirectory &&
                node.Path.startsWith(nodeToUpdate.Path))
            ) {
              newNode.Wanted = wanted;
              if (node.isDirectory) {
                newNode.indeterminate = false;
              }
            }

            if (node.children) {
              newNode.children = updateNodes(node.children);

              if (node.isDirectory) {
                const allWanted = newNode.children.every(
                  (child) => child.Wanted
                );
                const anyWanted = newNode.children.some(
                  (child) => child.Wanted || child.indeterminate
                );
                newNode.Wanted = allWanted;
                newNode.indeterminate = anyWanted && !allWanted;
              }
            }

            return newNode;
          });
        };

        return updateNodes(newTree);
      }
    );
    mockSetFilesWanted.mockResolvedValue(undefined);

    // Для отладки: покажите, что моки реально применились
    // eslint-disable-next-line no-console
    console.log(
      "setupCommonMocks: mockGetTorrentFiles",
      mockGetTorrentFiles.getMockName?.() || typeof mockGetTorrentFiles
    );
    // eslint-disable-next-line no-console
    console.log(
      "setupCommonMocks: mockBuildFileTree",
      mockBuildFileTree.getMockName?.() || typeof mockBuildFileTree
    );
    // eslint-disable-next-line no-console
    console.log("setupCommonMocks: mockRawFiles", JSON.stringify(mockRawFiles));
    // eslint-disable-next-line no-console
    console.log(
      "setupCommonMocks: mockFileTreeInitial",
      JSON.stringify(mockFileTreeInitial)
    );
  });
};
