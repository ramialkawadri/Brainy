import { createSelector } from "@reduxjs/toolkit";
import IFile from "../../types/file";
import IFolder from "../../types/folder";
import { RootState } from "../store";

export const selectError = (state: RootState) =>
    state.fileSystem.error;

export const selectRootFolder = (state: RootState) =>
    state.fileSystem.rootFolder;

export const selectSelectedFileId = (state: RootState) =>
    state.fileSystem.selectedFileId;

export const selectSearchText = (state: RootState) =>
    state.fileSystem.searchText;

export const selectFileById = createSelector(
    [
        selectRootFolder,
        (_, id: number) => id
    ],
    (rootFolder, id) => selectById(rootFolder, id) as IFile,
);

export const selectFolderById = createSelector(
    [
        selectRootFolder,
        (_, id: number) => id
    ],
    (rootFolder, id) => selectById(rootFolder, id) as IFolder,
);

const selectById = (rootFolder: IFolder, id: number): IFile | IFolder => {
    let queue = [rootFolder];

    while (queue.length > 0) {
        const folder = queue.pop()!;
        if (folder.id === id) return folder;

        for (const file of folder.files) {
            if (file.id === id) return file;
        }
        queue = [...queue, ...folder.subFolders];
    }

    throw Error("Cannot find any item with the given id!");
};
