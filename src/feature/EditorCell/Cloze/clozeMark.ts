import { mergeAttributes, Mark } from "@tiptap/core";
import styles from "./styles.module.css";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		customExtension: {
			toggleCloze: (index: number) => ReturnType;
			increaseClozeIndex: () => ReturnType;
			decreaseClozeIndex: () => ReturnType;
		};
	}
}

export const clozeMarkName = "cloze";

const clozeMark = Mark.create({
	name: clozeMarkName,

	parseHTML() {
		return [{ tag: clozeMarkName }];
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
					if (editor.isActive(clozeMarkName)) {
						commands.extendMarkRange(clozeMarkName);
						return commands.unsetMark(clozeMarkName);
					} else {
						commands.unsetAllMarks();
						return commands.setMark(clozeMarkName, { index });
					}
				},
			increaseClozeIndex:
				() =>
				({ commands, editor }) => {
					if (!editor.isActive(clozeMarkName)) return true;
					commands.extendMarkRange(clozeMarkName);
					return commands.updateAttributes(clozeMarkName, {
						index:
							(editor.getAttributes(clozeMarkName)
								.index as number) + 1,
					});
				},
			decreaseClozeIndex:
				() =>
				({ commands, editor }) => {
					if (!editor.isActive(clozeMarkName)) return true;
					commands.extendMarkRange(clozeMarkName);
					return commands.updateAttributes(clozeMarkName, {
						index: Math.max(
							1,
							(editor.getAttributes(clozeMarkName)
								.index as number) - 1,
						),
					});
				},
		};
	},
});

export default clozeMark;
