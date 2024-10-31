import ICell, { CellType } from "../entities/cell";
import IFlashCard from "../types/flashCard";

function createDefaultCell(cellType: CellType, fileId: number, index: number) {
    const cell: ICell = {
        fileId,
        content: "",
        cellType,
        index,
    };

    switch (cellType) {
        case "FlashCard":
            cell.content = JSON.stringify({ question: "", answer: "" } as IFlashCard);
            break;
        case "Note":
            break;
    }
    return cell;
}

export default createDefaultCell;
