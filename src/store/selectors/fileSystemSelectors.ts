import { RootState } from "../store";

export const selectError = (state: RootState) =>
    state.fileSystem.error;

export const selectRootFolder = (state: RootState) =>
    state.fileSystem.rootFolder;

export const selectSelectedFileId = (state: RootState) =>
    state.fileSystem.selectedFileId;

export const selectSearchText = (state: RootState) =>
    state.fileSystem.searchText;
