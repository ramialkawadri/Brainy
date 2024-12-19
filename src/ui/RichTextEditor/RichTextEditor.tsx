import {
	BubbleMenu,
	useEditor,
	EditorContent,
	AnyExtension,
	ChainedCommands,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import styles from "./styles.module.css";
import Icon from "@mdi/react";
import {
	mdiFormatBold,
	mdiFormatItalic,
	mdiFormatListBulleted,
	mdiFormatListNumbered,
	mdiFormatSubscript,
	mdiFormatSuperscript,
	mdiFormatUnderline,
} from "@mdi/js";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import ImageResize from "tiptap-extension-resize-image";

const extensions = [
	StarterKit,
	ImageResize.configure({
		allowBase64: true,
	}),
	Underline,
	Subscript,
	Superscript,
];

interface additionalCommand {
	icon: string;
	name: string;
    title: string;
	onClick: (chaindedCommand: ChainedCommands) => ChainedCommands;
}

interface Props {
	content: string;
	title?: string;
	editable?: boolean;
	extraExtensions?: AnyExtension[];
	additionalCommands?: additionalCommand[];
	onUpdate: (html: string) => void;
}

function RichTextEditor({
	content,
	title,
	editable,
	extraExtensions,
	onUpdate,
	additionalCommands,
}: Props) {
	const editor = useEditor(
		{
			extensions: [...extensions, ...(extraExtensions ?? [])],
			content,
			editable,
			onUpdate: e => {
				if (e.editor.getHTML() !== content)
					onUpdate(e.editor.getHTML());
			},
		},
		[editable],
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
						{additionalCommands?.map(additionalCommand => (
							<button
								key={additionalCommand.icon}
								onClick={() =>
									additionalCommand
										.onClick(editor.chain().focus())
										.run()
								}
								className={`transparent ${editor.isActive(additionalCommand.name) && styles.activeButton}`}
								title={additionalCommand.title}
								aria-label={additionalCommand.title}>
								<Icon path={additionalCommand.icon} size={1} />
							</button>
						))}
                        {additionalCommands && additionalCommands.length > 0 && <div className={styles.verticalBorder} />}
						<button
							onClick={() =>
								editor.chain().focus().toggleBold().run()
							}
							className={`transparent ${editor.isActive("bold") && styles.activeButton}`}
							title="Bold"
							aria-label="Bold">
							<Icon path={mdiFormatBold} size={1} />
						</button>
						<button
							onClick={() =>
								editor.chain().focus().toggleItalic().run()
							}
							className={`transparent ${editor.isActive("italic") && styles.activeButton}`}
							title="Italic"
							aria-label="Italic">
							<Icon path={mdiFormatItalic} size={1} />
						</button>
						<button
							onClick={() =>
								editor.chain().focus().toggleUnderline().run()
							}
							className={`transparent ${editor.isActive("underline") && styles.activeButton}`}
							title="Underline"
							aria-label="Underline">
							<Icon path={mdiFormatUnderline} size={1} />
						</button>
						<button
							onClick={() =>
								editor.chain().focus().toggleOrderedList().run()
							}
							className={`transparent ${editor.isActive("orderedList") && styles.activeButton}`}
							title="Ordered list"
							aria-label="Ordered list">
							<Icon path={mdiFormatListNumbered} size={1} />
						</button>
						<button
							onClick={() =>
								editor.chain().focus().toggleBulletList().run()
							}
							className={`transparent ${editor.isActive("bulletList") && styles.activeButton}`}
							title="Bullet list"
							aria-label="Bullet list">
							<Icon path={mdiFormatListBulleted} size={1} />
						</button>
						<button
							onClick={() =>
								editor.chain().focus().toggleSubscript().run()
							}
							className={`transparent ${editor.isActive("subscript") && styles.activeButton}`}
							title="Subscript"
							aria-label="Subscript">
							<Icon path={mdiFormatSubscript} size={1} />
						</button>
						<button
							onClick={() =>
								editor.chain().focus().toggleSuperscript().run()
							}
							className={`transparent ${editor.isActive("superscript") && styles.activeButton}`}
							title="Superscript"
							aria-label="Superscript">
							<Icon path={mdiFormatSuperscript} size={1} />
						</button>
					</BubbleMenu>
				)}
				<EditorContent editor={editor} className={styles.editor} />
			</div>
		</>
	);
}

export default RichTextEditor;
