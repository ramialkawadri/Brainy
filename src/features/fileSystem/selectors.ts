import { RootState } from "../../store";

export const selectFileSystemIsLoading = (state: RootState) =>
    state.fileSystem.isLoading;

export const selectFileSystemError = (state: RootState) =>
    state.fileSystem.error;

export const selectFileSystemRootFolder = (state: RootState) =>
    state.fileSystem.rootFolder;

export const selectFileSystemSelectedFilePath = (state: RootState) =>
    state.fileSystem.selectedFilePath;

export const selectFileSystemSearchText = (state: RootState) =>
    state.fileSystem.searchText;
