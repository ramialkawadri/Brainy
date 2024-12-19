import {
	mdiCardMultipleOutline,
	mdiDotsHorizontal,
	mdiHelp,
	mdiNoteOutline,
} from "@mdi/js";
import { CellType } from "../type/backend/entity/cell";

function getCellIcon(cellType: CellType): string {
	switch (cellType) {
		case "FlashCard":
			return mdiCardMultipleOutline;
		case "Note":
			return mdiNoteOutline;
		case "Cloze":
			return mdiDotsHorizontal;
		default:
			return mdiHelp;
	}
}

export default getCellIcon;
