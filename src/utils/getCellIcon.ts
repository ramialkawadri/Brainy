import { mdiCardMultipleOutline, mdiHelp, mdiNoteOutline } from "@mdi/js";

function getCellIcon(cellType: CellType): string {
    switch (cellType) {
        case CellType.FlashCard:
            return mdiCardMultipleOutline;
        case CellType.Note:
            return mdiNoteOutline;
        default:
            return mdiHelp;
    }
}

export default getCellIcon;
