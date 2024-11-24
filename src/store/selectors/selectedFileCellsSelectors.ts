import { RootState } from "../store";

export const selectError = (state: RootState) => state.selectedFileCells.error;

export const selectSelectedFileCells = (state: RootState) =>
	state.selectedFileCells.cells;
