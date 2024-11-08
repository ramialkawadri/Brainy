import { createSelector } from "@reduxjs/toolkit";
import File from "../../types/file";
import Folder from "../../types/folder";
import { RootState } from "../store";
import getFileOrFolderById from "../../utils/getFilOrFolderById";

export const selectError = (state: RootState) =>
    state.fileSystem.error;

export const selectRootFolder = (state: RootState) =>
    state.fileSystem.rootFolder;

export const selectSelectedFileId = (state: RootState) =>
    state.fileSystem.selectedFileId;

export const selectFileById = createSelector(
    [
        selectRootFolder,
        (_, id: number) => id
    ],
    (rootFolder, id) => getFileOrFolderById(rootFolder, id) as File,
);

export const selectFolderById = createSelector(
    [
        selectRootFolder,
        (_, id: number) => id
    ],
    (rootFolder, id) => getFileOrFolderById(rootFolder, id) as Folder,
);

