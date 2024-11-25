import { invoke } from "@tauri-apps/api/core";
import { AppDispatch, RootState } from "../store";
import {
	removeErrorMessage,
	setErrorMessage,
	setSelectedFileCells,
} from "../reducers/selectedFileCellsReducers";
import { selectSelectedFileId } from "../selectors/fileSystemSelectors";
import Cell from "../../entities/cell";
import { selectSelectedFileCells } from "../selectors/selectedFileCellsSelectors";

export function retrieveSelectedFileCells() {
	return executeRequest(async (dispatch, state) => {
		const selectedFileId = selectSelectedFileId(state);
		const fetchedCells: Cell[] = await invoke(
			"get_file_cells_ordered_by_index",
			{
				fileId: selectedFileId,
			},
		);
		dispatch(setSelectedFileCells(fetchedCells));
	});
}

export function updateCellContent(id: number, content: string) {
	return executeRequest(async (dispatch, state) => {
		await invoke("update_cell", {
			cellId: id,
			content,
		});
		const selectedFileCells = selectSelectedFileCells(state);
		const newCells = [...selectedFileCells];
		const cellIndex = newCells.findIndex((c: Cell) => c.id == id);
		newCells[cellIndex] = {
			...newCells[cellIndex],
			content,
		};
		dispatch(setSelectedFileCells(newCells));
	});
}

export function createCell(cell: Cell) {
	return executeRequest(async dispatch => {
		await invoke("create_cell", { ...cell });
		await dispatch(retrieveSelectedFileCells());
	});
}

export function deleteCell(index: number) {
	return executeRequest(async (dispatch, state) => {
		const cells = selectSelectedFileCells(state);
		const cellId = cells[index].id;
		await invoke("delete_cell", { cellId });
		const newCells = [...cells];
		newCells.splice(index, 1);
		dispatch(setSelectedFileCells(newCells));
	});
}

export function moveCell(index: number, newIndex: number) {
	return executeRequest(async (dispatch, state) => {
		const cells = selectSelectedFileCells(state);
		await invoke("move_cell", {
			cellId: cells[index].id,
			newIndex,
		});
		await dispatch(retrieveSelectedFileCells());
	});
}

function executeRequest<T>(
	cb: (dispatch: AppDispatch, state: RootState) => Promise<T>,
) {
	return async function (dispatch: AppDispatch, getState: () => RootState) {
		try {
			dispatch(removeErrorMessage());
			await cb(dispatch, getState());
		} catch (e) {
			console.error(e);
			if (e instanceof Error) {
				console.error(e.stack);
				dispatch(setErrorMessage(e.message));
				return;
			}
			dispatch(setErrorMessage(e as string));
		}
	};
}
