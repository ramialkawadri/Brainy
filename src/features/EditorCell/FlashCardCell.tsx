import { useCallback, useMemo } from "react";
import Cell from "../../entities/cell";
import FlashCard from "../../types/flashCard";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import styles from "./styles.module.css";

interface IProps {
	cell: Cell;
	editable: boolean;
	onUpdate: (content: string) => void;
}

function FlashCardCell({ cell, editable, onUpdate }: IProps) {
	const flashCard = useMemo(
		() => (JSON.parse(cell.content) as FlashCard) ?? {},
		[cell.content],
	);

	const handleQuestionUpdate = useCallback(
		(html: string) =>
			onUpdate(
				JSON.stringify({
					question: html,
					answer: flashCard.answer,
				}),
			),
		[flashCard.answer, onUpdate],
	);

	const handleAnswerUpdate = useCallback(
		(html: string) =>
			onUpdate(
				JSON.stringify({
					question: flashCard.question,
					answer: html,
				}),
			),
		[flashCard.question, onUpdate],
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
