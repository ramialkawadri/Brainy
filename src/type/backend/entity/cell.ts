export type CellType = "FlashCard" | "Note" | "Cloze";
export const allCellTypes: CellType[] = ["Cloze", "FlashCard", "Note"];

export default interface Cell {
	id?: number;
	fileId: number;
	content: string;
	cellType: CellType;
	index: number;
}
