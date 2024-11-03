import { createSelector } from "@reduxjs/toolkit";
import IFile from "../../types/file";
import IFolder from "../../types/folder";
import { RootState } from "../store";
import getFileOrFolderById from "../../utils/getFilOrFolderById";

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
    (rootFolder, id) => getFileOrFolderById(rootFolder, id) as IFile,
);

export const selectFolderById = createSelector(
    [
        selectRootFolder,
        (_, id: number) => id
    ],
    (rootFolder, id) => getFileOrFolderById(rootFolder, id) as IFolder,
);

