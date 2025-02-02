import Cell from "../../type/backend/entity/cell";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import ClozeCell from "./Cloze/Cloze";
import FlashCardCell from "./FlashCardCell";

interface Props {
	cell: Cell;
	editable: boolean;
    autofocus: boolean;
	onUpdate: (content: string) => void;
}

function EditorCell({ cell, editable, autofocus, onUpdate }: Props) {
	switch (cell.cellType) {
		case "FlashCard":
			return (
				<FlashCardCell
					cell={cell}
					editable={editable}
                    autofocus={autofocus}
					onUpdate={onUpdate}
				/>
			);
		case "Note":
			return (
				<RichTextEditor
					content={cell.content}
					editable={editable}
					onUpdate={onUpdate}
                    autofocus={autofocus}
				/>
			);
		case "Cloze":
			return (
				<ClozeCell
					cell={cell}
					editable={editable}
                    autofocus={autofocus}
					onUpdate={onUpdate}
				/>
			);
	}
}

export default EditorCell;
