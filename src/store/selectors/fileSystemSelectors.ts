import { createSelector } from "@reduxjs/toolkit";
import ParsedFile from "../../type/parsedFile";
import ParsedFolder from "../../type/parsedFolder";
import { RootState } from "../store";
import getFolderChildById from "../../util/getFolderChildById";

export const selectError = (state: RootState) => state.fileSystem.error;

export const selectRootFolder = (state: RootState) =>
	state.fileSystem.rootFolder;

export const selectSelectedFileId = (state: RootState) =>
	state.fileSystem.selectedFileId;

export const selectFileById = createSelector(
	[selectRootFolder, (_, id: number) => id],
	(rootFolder, id) => getFolderChildById(rootFolder, id) as ParsedFile,
);

export const selectFolderById = createSelector(
	[selectRootFolder, (_, id: number) => id],
	(rootFolder, id) => getFolderChildById(rootFolder, id) as ParsedFolder,
);
