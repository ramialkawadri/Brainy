// import { v4 as uuidv4 } from "uuid";

function createDefaultCell(cellType: CellType) {
    const cellInfo: CellInfoDto = {
        type: cellType,
        id: uuidv4(),
    };

    switch (cellType) {
        case CellType.FlashCard:
            cellInfo.data = { question: "", answer: "" } as IFlashCard;
            break;
        case CellType.Note:
            cellInfo.data = "";
    }
    return cellInfo;
}

export default createDefaultCell;
