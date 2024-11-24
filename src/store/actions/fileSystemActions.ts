import UserFile from "../../entities/userFile";
import getFileOrFolderById from "../../utils/getFilOrFolderById";
import parseGetFilesResponse from "../../utils/parseGetFilesResponse";
import {
	requestFailure,
	requestStart,
	requestSuccess,
	setSelectedFileId,
} from "../reducers/fileSystemReducers";
import { selectFolderById, selectSelectedFileId } from "../selectors/fileSystemSelectors";
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

export function deleteFile(fileId: number) {
	return executeRequest(async (dispatch, state) => {
		await invoke("delete_file", { fileId });
		if (selectSelectedFileId(state) === fileId) {
			dispatch(setSelectedFileId(null));
		}
	});
}

export function deleteFolder(folderId: number) {
	return executeRequest(async (dispatch, state) => {
		const selectedFileId = selectSelectedFileId(state);
		const folder = selectFolderById(state, folderId);
		const isSelectedFileInFolder =
			selectedFileId && getFileOrFolderById(folder, selectedFileId);

		await invoke("delete_folder", { folderId });

		if (isSelectedFileInFolder) {
			dispatch(setSelectedFileId(null));
		}
	});
}

export function renameFile(fileId: number, newName: string) {
	return executeRequest(() => invoke("rename_file", { fileId, newName }));
}

export function renameFolder(folderId: number, newName: string) {
	return executeRequest(() => invoke("rename_folder", { folderId, newName }));
}

export function moveFile(fileId: number, destinationFolderId: number) {
	return executeRequest(() =>
		invoke("move_file", {
			fileId,
			destinationFolderId,
		}),
	);
}

export function moveFolder(folderId: number, destinationFolderId: number) {
	return executeRequest(() =>
		invoke("move_folder", {
			folderId,
			destinationFolderId,
		}),
	);
}

function executeRequest<T>(cb: (dispatch: AppDispatch, state: RootState) => Promise<T>) {
	return async function (dispatch: AppDispatch, getState: () => RootState) {
		try {
			dispatch(requestStart());
			await cb(dispatch, getState());
			const userFiles: UserFile[] = await invoke("get_files");
			const rootFolder = parseGetFilesResponse(userFiles);
			dispatch(requestSuccess(rootFolder));
		} catch (e) {
			console.error(e);
			if (e instanceof Error) {
				console.error(e.stack);
			}
			dispatch(requestFailure(e as string));
		}
	};
}
