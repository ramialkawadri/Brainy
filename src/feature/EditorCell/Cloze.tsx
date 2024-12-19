import { mergeAttributes, Mark } from "@tiptap/core";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import styles from "./styles.module.css";
import { mdiDotsHorizontal, mdiNumericNegative1, mdiNumericPositive1 } from "@mdi/js";
import Cell from "../../type/backend/entity/cell";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		customExtension: {
			toggleCloze: (index: number) => ReturnType;
		};
	}
}

const name = "cloze";

const mark = Mark.create({
	name,

	parseHTML() {
		return [
			{
				tag: name,
			},
		];
	},

	addAttributes() {
		return {
			index: {
				renderHTML(attributes) {
					return {
						index: attributes.index as number,
					};
				},
			},
		};
	},

	renderHTML({ HTMLAttributes }) {
		return [
			"cloze",
			mergeAttributes(HTMLAttributes, {
				class: styles.clozeMark,
			}),
			0,
		];
	},

	addCommands() {
		return {
			toggleCloze:
				index =>
				({ commands }) => {
					return commands.toggleMark(name, { index });
				},
		};
	},
});

interface Props {
	cell: Cell;
	editable: boolean;
	onUpdate: (content: string) => void;
}

function ClozeCell({ cell, editable, onUpdate }: Props) {
    // TODO: cloze index, add, decrease index commands, rust backend

	return (
		<RichTextEditor
			extraExtensions={[mark]}
			additionalCommands={[
				{
					name,
					icon: mdiDotsHorizontal,
                    title: "Cloze",
					onClick: c => c.toggleCloze(1),
				},
				{
					name,
					icon: mdiNumericPositive1,
                    title: "Increase cloze number",
					onClick: c => c.toggleCloze(1),
				},
				{
					name,
					icon: mdiNumericNegative1,
                    title: "Decrease cloze number",
					onClick: c => c.toggleCloze(1),
				},
			]}
			content={cell.content}
			editable={editable}
			onUpdate={onUpdate}
		/>
	);
}

export default ClozeCell;
