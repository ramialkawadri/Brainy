import IUserFile from "../../entities/userFile";
import parseGetFilesResponse from "../../utils/parseGetFilesResponse";
import { requestFailure, requestStart, requestSuccess } from "../reducers/fileSystemReducers";
import { AppDispatch } from "../store";
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
    // TODO: if selected file is deleted then change selected fiel id
    return executeRequest(() => invoke("delete_file", { path }));
}

export function deleteFolder(path: string) {
    // TODO: if selected file is deleted then change selected fiel id
    return executeRequest(() => invoke("delete_folder", { path }));
}

export function renameFile(path: string, newName: string) {
    return executeRequest(() => invoke("rename_file", { path, newName }));
}

export function renameFolder(path: string, newName: string) {
    return executeRequest(() => invoke("rename_folder", { path, newName }));
}

export function moveFile(path: string, destination: string) {
    return executeRequest(() => invoke("move_file", { path, destination }));
}

export function moveFolder(path: string, destination: string) {
    return executeRequest(() => invoke("move_folder", { path, destination }));
}

function executeRequest<T>(cb: () => Promise<T>) {
    return async function(dispatch: AppDispatch) {
        try {
            dispatch(requestStart());
            await cb();
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
