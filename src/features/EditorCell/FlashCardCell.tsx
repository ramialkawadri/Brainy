import { useMemo } from "react";
import Cell from "../../entities/cell";
import FlashCard from "../../types/flashCard";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import styles from "./styles.module.css";

interface Props {
	cell: Cell;
	editable: boolean;
	onUpdate: (content: string) => void;
}

function FlashCardCell({ cell, editable, onUpdate }: Props) {
	const flashCard = useMemo(
		() => (JSON.parse(cell.content) as FlashCard) ?? {},
		[cell.content],
	);

	const handleQuestionUpdate = (html: string) =>
		onUpdate(
			JSON.stringify({
				question: html,
				answer: flashCard.answer,
			}),
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
			/>
			<RichTextEditor
				title="Answer"
				content={flashCard.answer}
				onUpdate={handleAnswerUpdate}
				editable={editable}
			/>
		</div>
	);
}

export default FlashCardCell;
