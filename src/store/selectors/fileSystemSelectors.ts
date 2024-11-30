import { createSelector } from "@reduxjs/toolkit";
import ParsedFile from "../../types/parsedFile";
import ParsedFolder from "../../types/parsedFolder";
import { RootState } from "../store";
import getFileOrFolderById from "../../utils/getFilOrFolderById";

export const selectError = (state: RootState) => state.fileSystem.error;

export const selectRootFolder = (state: RootState) =>
	state.fileSystem.rootFolder;

export const selectSelectedFileId = (state: RootState) =>
	state.fileSystem.selectedFileId;

export const selectFileById = createSelector(
	[selectRootFolder, (_, id: number) => id],
	(rootFolder, id) => getFileOrFolderById(rootFolder, id) as ParsedFile,
);

export const selectFolderById = createSelector(
	[selectRootFolder, (_, id: number) => id],
	(rootFolder, id) => getFileOrFolderById(rootFolder, id) as ParsedFolder,
);
