import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import IFolder from "../../types/folder";

interface IFileSystemState {
    error: string | null,
    rootFolder: IFolder,
    selectedFileId: number | null,
}

const initialState: IFileSystemState = {
    error: null,
    rootFolder: { id: 0, files: [], name: "", subFolders: [], },
    selectedFileId: null,
};

export const fileSystemSlice = createSlice({
    name: "fileSystem",
    initialState,
    reducers: {
        requestStart: (state) => {
            state.error = null;
        },
        requestSuccess: (state, payload: PayloadAction<IFolder>) => {
            state.error = null;
            state.rootFolder = payload.payload;
        },
        requestFailure: (state, payload: PayloadAction<string>) => {
            state.error = payload.payload;
        },
        setSelectedFileId: (state, payload: PayloadAction<number | null>) => {
            state.selectedFileId = payload.payload;
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
    setSelectedFileId,
    setErrorMessage,
} = fileSystemSlice.actions;
