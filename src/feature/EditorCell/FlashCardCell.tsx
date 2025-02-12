import { useRef } from "react";
import Cell from "../../type/backend/entity/cell";
import FlashCard from "../../type/cell/flashCard";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import styles from "./styles.module.css";
import { Editor } from "@tiptap/react";

interface Props {
	cell: Cell;
	editable: boolean;
	autofocus: boolean;
	onUpdate: (content: string) => void;
	onFocus: (editor: Editor) => void;
}

function FlashCardCell({
	cell,
	editable,
	autofocus,
	onUpdate,
	onFocus,
}: Props) {
	const flashCard = JSON.parse(cell.content) as FlashCard;
	const isAnswerEditorFocused = useRef(false);

	const handleQuestionUpdate = (html: string) =>
		onUpdate(
			JSON.stringify({
				question: html,
				answer: flashCard.answer,
			} as FlashCard),
		);

	const handleAnswerUpdate = (html: string) =>
		onUpdate(
			JSON.stringify({
				question: flashCard.question,
				answer: html,
			}),
		);

	return (
		<div className={styles.flashCard}>
			<RichTextEditor
				title="Question"
				content={flashCard.question}
				onUpdate={handleQuestionUpdate}
				editable={editable}
				autofocus={autofocus && !isAnswerEditorFocused.current}
				onFocus={onFocus}
			/>
			<RichTextEditor
				title="Answer"
				content={flashCard.answer}
				autofocus={false}
				editable={editable}
				onUpdate={handleAnswerUpdate}
				onFocus={e => {
					isAnswerEditorFocused.current = true;
					onFocus(e);
				}}
				onBlur={() => (isAnswerEditorFocused.current = false)}
			/>
		</div>
	);
}

export default FlashCardCell;
