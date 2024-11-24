export type CellType = "FlashCard" | "Note";
export const allCellTypes: CellType[] = ["FlashCard", "Note"];

export default interface Cell {
	id: number;
	fileId: number;
	content: string;
	cellType: CellType;
	index: number;
}
