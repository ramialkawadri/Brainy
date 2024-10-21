import { RootState } from "../../store";

export const selectFileSystemIsLoading = (state: RootState) =>
    state.fileSystem.isLoading;

export const selectFileSystemError = (state: RootState) =>
    state.fileSystem.error;

export const selectFileSystemRootFolder = (state: RootState) =>
    state.fileSystem.rootFolder;

export const selectFileSelectedFilePath = (state: RootState) =>
    state.fileSystem.selectedFilePath;
