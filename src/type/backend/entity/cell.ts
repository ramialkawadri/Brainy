export type CellType = "FlashCard" | "Note" | "Cloze";
export const allCellTypes: CellType[] = ["Cloze", "FlashCard", "Note"];
export const cellTypesDisplayNames: Record<CellType, string> = {
	Note: "Note",
	Cloze: "Cloze",
	FlashCard: "Flash Card",
};

export default interface Cell {
	id?: number;
	fileId: number;
	content: string;
	cellType: CellType;
	index: number;
}
