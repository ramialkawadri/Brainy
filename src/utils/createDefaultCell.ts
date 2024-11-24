import Cell, { CellType } from "../entities/cell";
import FlashCard from "../types/flashCard";

function createDefaultCell(cellType: CellType, fileId: number, index: number) {
	const cell: Cell = {
		fileId,
		content: "",
		cellType,
		index,
	};

	switch (cellType) {
		case "FlashCard":
			cell.content = JSON.stringify({
				question: "",
				answer: "",
			} as FlashCard);
			break;
		case "Note":
			break;
	}
	return cell;
}

export default createDefaultCell;
