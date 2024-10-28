import IUserFile from "../../entities/userFile";
import parseGetFilesResponse from "../../utils/parseGetFilesResponse";
import { requestFailure, requestStart, requestSuccess, setSelectedFilePath } from "../reducers/fileSystemReducers";
import { selectSelectedFilePath } from "../selectors/fileSystemSelectors";
import { AppDispatch, RootState } from "../store";
import { invoke } from "@tauri-apps/api/core";

export function fetchFiles() {
    return executeRequest(() => Promise.resolve());
}

export function createFile(path: string) {
    return executeRequest(async () => {
        return invoke("create_file", { path });
    });
}

export function createFolder(path: string) {
    return executeRequest(() => {
        return invoke("create_folder", { path });
    });
}

export function deleteFile(path: string) {
    return executeRequest(async (dispatch, state) => {
        await invoke("delete_file", { path });

        if (selectSelectedFilePath(state) === path) {
            dispatch(setSelectedFilePath(null));
        }
    });
}

export function deleteFolder(path: string) {
    return executeRequest(async (dispatch, state) => {
        await invoke("delete_folder", { path });

        if (selectSelectedFilePath(state).startsWith(path + "/")) {
            dispatch(setSelectedFilePath(null));
        }
    });
}

export function renameFile(path: string, newName: string) {
    return executeRequest(async (dispatch, state) => {
        const newPath: string = await invoke("rename_file", { path, newName });

        if (selectSelectedFilePath(state) === path) {
            dispatch(setSelectedFilePath(newPath));
        }
    });
}

export function renameFolder(path: string, newName: string) {
    return executeRequest(async (dispatch, state) => {
        const newPath: string = await invoke("rename_folder", { path, newName });

        const selectedFile = selectSelectedFilePath(state);
        if (selectedFile.startsWith(path + "/")) {
            const newSelectedFilePath =
                newPath + "/" + selectedFile.substring(path.length + 1);
            dispatch(setSelectedFilePath(newSelectedFilePath));
        }
    });
}

export function moveFile(path: string, destination: string) {
    return executeRequest(async (dispatch, state) => {
        const newPath: string = await invoke("move_file", { path, destination });

        if (selectSelectedFilePath(state) === path) {
            dispatch(setSelectedFilePath(newPath));
        }
    });
}

export function moveFolder(path: string, destination: string) {
    return executeRequest(async (dispatch, state) => {
        const newPath: string = await invoke("move_folder", { path, destination });
    
        const selectedFile = selectSelectedFilePath(state);
        if (selectedFile.startsWith(path + "/")) {
            const newFilePath = newPath + "/" +
                selectedFile.substring(path.length + 1);
            dispatch(setSelectedFilePath(newFilePath));
        }
    });
}

function executeRequest<T>(cb: (dispatch: AppDispatch, state: RootState) => Promise<T>) {
    return async function(dispatch: AppDispatch, getState: () => RootState) {
        try {
            dispatch(requestStart());
            await cb(dispatch, getState());
            const userFiles: IUserFile[] = await invoke("get_files");
            const rootFolder = parseGetFilesResponse(userFiles);
            dispatch(requestSuccess(rootFolder));
        } catch (e) {
            console.error(e);
            if (e instanceof Error) {
                console.error(e.stack);
            }
            dispatch(requestFailure(e as string));
        }
    }
}
