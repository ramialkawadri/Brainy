import { invoke } from "@tauri-apps/api/core";
import { AppDispatch, RootState } from "../store";
import {
	removeErrorMessage,
	setErrorMessage,
	setSelectedFileCells,
} from "../reducers/selectedFileCellsReducers";
import { selectSelectedFileId } from "../selectors/fileSystemSelectors";
import Cell from "../../entities/cell";

export function retrieveSelectedFileCells() {
	return executeRequest(async (dispatch, state) => {
		const selectedFileId = selectSelectedFileId(state);
		const fetchedCells: Cell[] = await invoke("get_file_cells_ordered_by_index", {
			fileId: selectedFileId,
		});
		dispatch(setSelectedFileCells(fetchedCells));
	});
}

function executeRequest<T>(cb: (dispatch: AppDispatch, state: RootState) => Promise<T>) {
	return async function (dispatch: AppDispatch, getState: () => RootState) {
		try {
			dispatch(removeErrorMessage());
			await cb(dispatch, getState());
		} catch (e) {
			console.error(e);
			if (e instanceof Error) {
				console.error(e.stack);
			}
			dispatch(setErrorMessage(e as string));
		}
	};
}
