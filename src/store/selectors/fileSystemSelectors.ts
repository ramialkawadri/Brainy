import { RootState } from "../store";

export const selectError = (state: RootState) =>
    state.fileSystem.error;

export const selectRootFolder = (state: RootState) =>
    state.fileSystem.rootFolder;

export const selectSelectedFilePath = (state: RootState) =>
    state.fileSystem.selectedFilePath;

export const selectSearchText = (state: RootState) =>
    state.fileSystem.searchText;
