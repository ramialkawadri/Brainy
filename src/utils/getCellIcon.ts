import { mdiCardMultipleOutline, mdiHelp, mdiNoteOutline } from "@mdi/js";
import { CellType } from "../entities/cell";

function getCellIcon(cellType: CellType): string {
    switch (cellType) {
        case "FlashCard":
            return mdiCardMultipleOutline;
        case "Note":
            return mdiNoteOutline;
        default:
            return mdiHelp;
    }
}

export default getCellIcon;
