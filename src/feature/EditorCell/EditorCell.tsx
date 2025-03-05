import { Editor } from "@tiptap/react";
import Cell from "../../type/backend/entity/cell";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import ClozeCell from "./Cloze/Cloze";
import FlashCardCell from "./FlashCardCell";
import TrueFalseCell from "./TrueFalseCell";

interface Props {
	cell: Cell;
	autofocus: boolean;
	onUpdate: (content: string) => void;
	onFocus: (editor: Editor) => void;
}

function EditorCell({ cell, autofocus, onUpdate, onFocus }: Props) {
	switch (cell.cellType) {
		case "FlashCard":
			return (
				<FlashCardCell
					cell={cell}
					autofocus={autofocus}
					onUpdate={onUpdate}
					onFocus={onFocus}
				/>
			);
		case "Note":
			return (
				<RichTextEditor
					initialContent={cell.content}
					onUpdate={onUpdate}
					autofocus={autofocus}
					onFocus={onFocus}
				/>
			);
		case "Cloze":
			return (
				<ClozeCell
					cell={cell}
					autofocus={autofocus}
					onUpdate={onUpdate}
					onFocus={onFocus}
				/>
			);
		case "TrueFalse":
			return (
				<TrueFalseCell
					cell={cell}
					autofocus={autofocus}
					onUpdate={onUpdate}
					onFocus={onFocus}
				/>
			);
	}
}

export default EditorCell;
