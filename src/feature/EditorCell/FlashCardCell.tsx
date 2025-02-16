import { useRef, useState } from "react";
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

	const [question, setQuestion] = useState(flashCard.question);
	const [answer, setAnswer] = useState(flashCard.answer);
	const isAnswerEditorFocused = useRef(false);

	const handleQuestionUpdate = (html: string) => {
		setQuestion(html);
		onUpdate(
			JSON.stringify({
				question: html,
				answer,
			} as FlashCard),
		);
	};

	const handleAnswerUpdate = (html: string) => {
		setAnswer(html);
		onUpdate(
			JSON.stringify({
				question,
				answer: html,
			}),
		);
	};

	return (
		<div className={styles.flashCard}>
			<RichTextEditor
				title="Question"
				initialContent={question}
				onUpdate={handleQuestionUpdate}
				editable={editable}
				autofocus={autofocus && !isAnswerEditorFocused.current}
				onFocus={onFocus}
			/>
			<RichTextEditor
				title="Answer"
				initialContent={answer}
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
