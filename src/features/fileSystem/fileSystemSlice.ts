import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "../../store";
import IFolder from "./Folder";
import { getDatabase } from "../../constants";
import { v4 as uuidv4 } from "uuid";
import parseListUserFilesResponse from "../../utils/parseListUserFilesResponse";
import renameFile from "../../utils/renameFile";

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
    }
});

export default fileSystemSlice.reducer;

const { requestStart, requestSuccess, requestFailure, setSelectedFilePath } = fileSystemSlice.actions;
export { setSelectedFilePath };

function executeRequest<T>(cb: () => Promise<T>) {
    return async function(dispatch: AppDispatch) {
        try {
            dispatch(requestStart());
            await cb();
            dispatch(requestSuccess(await getUserFiles()));
        } catch (e) {
            console.error(e);

            if (e instanceof Error) {
                dispatch(requestFailure(e.message));
            }
        }
    }
}

// Represents the database record
export interface IUserFileEntity {
    id: string,
    path: string,
    isFolder: number,
}

async function getUserFiles() {
    const db = await getDatabase();
    const result: IUserFileEntity[] = await db.select(
        "SELECT id, path, isFolder FROM user_files");
    console.log(result);
    const folder = parseListUserFilesResponse(result);
    return folder
}

export function fetchFiles() {
    return executeRequest(getUserFiles);
}

export function createFile(path: string) {
    return executeRequest(async () => {
        // TODO: check if file exists before
        // TODO: path cannot be in non existing folder
        const db = await getDatabase();
        await db.execute(
            "INSERT INTO user_files(id, path, isFolder) VALUES ($1, $2, $3)",
            [uuidv4(), path, 0]);
    });
}

export function createFolder(path: string) {
    return executeRequest(async () => {
        // TODO: check if folder exists before
        // TODO: path cannot be in non existing folder
        const db = await getDatabase();
        await db.execute(
            "INSERT INTO user_files(id, path, isFolder) VALUES ($1, $2, $3)",
            [uuidv4(), path, 1]);
    });
}

export function deleteFile(path: string) {
    return executeRequest(async () => {
        const db = await getDatabase();
        await db.execute(
            "DELETE FROM user_files WHERE path = $1",
            [path]);
    });
}

export function deleteFolder(path: string) {
    return executeRequest(async () => {
        const db = await getDatabase();
        console.log(path);
        await db.execute(
            "DELETE FROM user_files WHERE path LIKE concat($1, '/%')",
            [path]);
        await db.execute(
            "DELETE FROM user_files WHERE path = $1 AND isFolder = 1",
            [path]);
    });
}

export function updateFileName(path: string, newName: string) {

        // TODO:
        /*if (!newName.trim()) {
            setErrorMessage("Please enter a non empty name!");
            return;
        }

        if (selectedFile === path) {
            await saveFile();
        }
        const newFullPath = renameFile(path, newName);
        const success = await sendFileModificationCall(backendApi.renameFile({
            oldPath: path,
            newPath: newFullPath,
        }));
        if (success && selectedFile === path) {
            await setSelectedFile(newFullPath);
        }*/

    return executeRequest(async () => {
        const db = await getDatabase();
        const newFullPath = renameFile(path, newName);
        await db.execute(
            "UPDATE user_files SET path = $1 WHERE path = $2",
            [newFullPath, path]);
    });
}

export const selectFileSystemIsLoading = (state: RootState) =>
    state.fileSystem.isLoading;

export const selectFileSystemError = (state: RootState) =>
    state.fileSystem.error;

export const selectFileSystemRootFolder = (state: RootState) =>
    state.fileSystem.rootFolder;

export const selectFileSelectedFilePath = (state: RootState) =>
    state.fileSystem.selectedFilePath;
