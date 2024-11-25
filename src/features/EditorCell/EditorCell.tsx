import Cell from "../../entities/cell";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import FlashCardCell from "./FlashCardCell";

interface Props {
	cell: Cell;
	editable: boolean;
	onUpdate: (content: string) => void;
}

function EditorCell({ cell, editable, onUpdate }: Props) {
	switch (cell.cellType) {
		case "FlashCard":
			return (
				<FlashCardCell
					cell={cell}
					editable={editable}
					onUpdate={onUpdate}
				/>
			);
		case "Note":
			return (
				<RichTextEditor
					content={cell.content}
					editable={editable}
					onUpdate={onUpdate}
				/>
			);
	}
}

export default EditorCell;
