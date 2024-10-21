import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import IFolder from "./folder";

interface IFileSystemState {
    isLoading: boolean,
    error: string | null,
    rootFolder: IFolder,
    selectedFilePath: string,
}

const initialState: IFileSystemState = {
    isLoading: false,
    error: null,
    rootFolder: { id: "", files: [], name: "", subFolders: [] },
    selectedFilePath: "",
};

export const fileSystemSlice = createSlice({
    name: "fileSystem",
    initialState,
    reducers: {
        requestStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        requestSuccess: (state, payload: PayloadAction<IFolder>) => {
            state.isLoading = false;
            state.error = null;
            state.rootFolder = payload.payload;
        },
        requestFailure: (state, payload: PayloadAction<string>) => {
            state.isLoading = false;
            state.error = payload.payload;
        },
        setSelectedFilePath: (state, payload: PayloadAction<string>) => {
            state.selectedFilePath = payload.payload;
        },
        setErrorMessage: (state, payload: PayloadAction<string>) => {
            state.error = payload.payload;
        },
    }
});

export default fileSystemSlice.reducer;

export const {
    requestStart,
    requestSuccess,
    requestFailure,
    setSelectedFilePath,
    setErrorMessage,
} = fileSystemSlice.actions;
