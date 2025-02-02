import {
	BubbleMenu,
	useEditor,
	EditorContent,
	AnyExtension,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import styles from "./styles.module.css";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import ImageResize from "tiptap-extension-resize-image";
import BubbleMenuCommand, { Command } from "./Command";
import { defaultCommands } from "./defaultCommands";

const extensions = [
	StarterKit,
	ImageResize.configure({
		allowBase64: true,
	}),
	Underline,
	Subscript,
	Superscript,
];

interface Props {
	content: string;
	title?: string;
	editable?: boolean;
	extraExtensions?: AnyExtension[];
	commands?: Command[];
	autofocus: boolean;
	onUpdate: (html: string) => void;
}

function RichTextEditor({
	content,
	title,
	editable,
	extraExtensions,
	commands,
	autofocus,
	onUpdate,
}: Props) {
	const editor = useEditor(
		{
			extensions: [...extensions, ...(extraExtensions ?? [])],
			content,
			editable,
			autofocus: autofocus,
			onUpdate: e => {
				if (e.editor.getHTML() !== content)
					onUpdate(e.editor.getHTML());
			},
			editorProps: {
				handleKeyDown: (_, e) => {
					// Do not insert new lines when clicking Ctrl + Enter.
					if (e.ctrlKey && e.code === "Enter") {
						return true;
					}
					return false;
				},
			},
		},
		[editable, autofocus],
	);

	return (
		<>
			{title && <p className={styles.title}>{title}</p>}

			<div className={styles.innerEditor}>
				{editor && (
					<BubbleMenu
						editor={editor}
						tippyOptions={{ duration: 100 }}
						className={styles.bubbleMenu}>
						{commands?.map(c => (
							<BubbleMenuCommand
								key={c.name}
								command={c}
								editor={editor}
							/>
						))}
						{commands && commands.length > 0 && (
							<div className={styles.verticalBorder} />
						)}

						{defaultCommands.map(c => (
							<BubbleMenuCommand
								key={c.name}
								command={c}
								editor={editor}
							/>
						))}
					</BubbleMenu>
				)}
				<EditorContent editor={editor} className={styles.editor} />
			</div>
		</>
	);
}

export default RichTextEditor;
