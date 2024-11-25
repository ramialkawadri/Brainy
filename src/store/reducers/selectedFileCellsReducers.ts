import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import Cell from "../../entities/cell";

interface SelectedFileCellsState {
	cells: Cell[];
	error: string | null;
}

const initialState: SelectedFileCellsState = {
	cells: [],
	error: null,
};

export const selectedFileCellsSlice = createSlice({
	name: "selectedFileCells",
	initialState,
	reducers: {
		setSelectedFileCells: (state, payload: PayloadAction<Cell[]>) => {
			state.cells = payload.payload;
		},
		setErrorMessage: (state, payload: PayloadAction<string>) => {
			state.error = payload.payload;
		},
		removeErrorMessage: state => {
			state.error = null;
		},
	},
});

export default selectedFileCellsSlice.reducer;

export const { setSelectedFileCells, setErrorMessage, removeErrorMessage } =
	selectedFileCellsSlice.actions;
