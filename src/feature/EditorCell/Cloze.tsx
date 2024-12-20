// TODO: refactor
import { mergeAttributes, Mark, ChainedCommands } from "@tiptap/core";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import styles from "./styles.module.css";
import {
	mdiDotsHorizontal,
	mdiNumericNegative1,
	mdiNumericPositive1,
} from "@mdi/js";
import Cell from "../../type/backend/entity/cell";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		customExtension: {
			toggleCloze: (index: number) => ReturnType;
			increaseClozeIndex: () => ReturnType;
			decreaseClozeIndex: () => ReturnType;
		};
	}
}

const name = "cloze";

const mark = Mark.create({
	name,

	parseHTML() {
		return [{ tag: name }];
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
				({ commands, editor }) => {
					if (editor.isActive(name)) {
						commands.extendMarkRange(name);
						return commands.unsetMark(name);
					} else {
						commands.unsetAllMarks();
						return commands.setMark(name, { index });
					}
				},
			increaseClozeIndex:
				() =>
				({ commands, editor }) => {
					if (!editor.isActive(name)) return true;
					commands.extendMarkRange(name);
					return commands.updateAttributes(name, {
						index: (editor.getAttributes(name).index as number) + 1,
					});
				},
			decreaseClozeIndex:
				() =>
				({ commands, editor }) => {
					if (!editor.isActive(name)) return true;
					commands.extendMarkRange(name);
					return commands.updateAttributes(name, {
						index: Math.max(
							1,
							(editor.getAttributes(name).index as number) - 1,
						),
					});
				},
		};
	},
});

interface Props {
	cell: Cell;
	editable: boolean;
	onUpdate: (content: string) => void;
}

const regexp = /<cloze[^>]*index="(\d+)"[^>]*>/g;

function ClozeCell({ cell, editable, onUpdate }: Props) {
	// TODO: refactor, rust backend

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
			extraExtensions={[mark]}
			additionalCommands={[
				{
					name,
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
			content={cell.content}
			editable={editable}
			onUpdate={onUpdate}
		/>
	);
}

export default ClozeCell;
