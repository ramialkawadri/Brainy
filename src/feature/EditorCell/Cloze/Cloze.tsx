import { ChainedCommands, Editor } from "@tiptap/core";
import RichTextEditor from "../../../ui/RichTextEditor/RichTextEditor";
import {
	mdiDotsHorizontal,
	mdiNumericNegative1,
	mdiNumericPositive1,
} from "@mdi/js";
import Cell from "../../../type/backend/entity/cell";
import clozeMark, { clozeMarkName } from "./clozeMark";

interface Props {
	cell: Cell;
	editable: boolean;
	autofocus: boolean;
	onUpdate: (content: string) => void;
	onFocus: (editor: Editor) => void;
}

const regexp = /<cloze[^>]*index="(\d+)"[^>]*>/g;

function ClozeCell({ cell, editable, autofocus, onUpdate, onFocus }: Props) {
	const handleToggleCloze = (commands: ChainedCommands) => {
		const matches = cell.content.matchAll(regexp);
		let newClozeIndex = 1;
		for (const match of matches) {
			newClozeIndex = Math.max(newClozeIndex, Number(match[1]));
		}
		return commands.toggleCloze(newClozeIndex);
	};

	return (
		<RichTextEditor
			extraExtensions={[clozeMark]}
			commands={[
				{
					name: clozeMarkName,
					icon: mdiDotsHorizontal,
					title: "Cloze",
					onClick: handleToggleCloze,
				},
				{
					name: "Cloze+1",
					icon: mdiNumericPositive1,
					title: "Increase cloze number",
					onClick: c => c.increaseClozeIndex(),
				},
				{
					name: "Cloze-1",
					icon: mdiNumericNegative1,
					title: "Decrease cloze number",
					onClick: c => c.decreaseClozeIndex(),
				},
			]}
			initialContent={cell.content}
			editable={editable}
			autofocus={autofocus}
			onUpdate={onUpdate}
			onFocus={onFocus}
		/>
	);
}

export default ClozeCell;
