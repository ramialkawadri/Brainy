import Cell, { CellType } from "../type/backend/entity/cell";
import FlashCard from "../type/flashCard";

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
		case "Cloze":
			break;
	}
	return cell;
}

export default createDefaultCell;
