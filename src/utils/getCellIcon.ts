import { mdiCardMultipleOutline, mdiHelp, mdiNoteOutline } from "@mdi/js";
import ICell from "../entities/cell";

function getCellIcon(cell: ICell): string {
    switch (cell.cellType) {
        case "FlashCard":
            return mdiCardMultipleOutline;
        case "Note":
            return mdiNoteOutline;
        default:
            return mdiHelp;
    }
}

export default getCellIcon;
