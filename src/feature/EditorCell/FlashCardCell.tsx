import Cell from "../../type/backend/entity/cell";
import FlashCard from "../../type/flashCard";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import styles from "./styles.module.css";

interface Props {
	cell: Cell;
	editable: boolean;
	onUpdate: (content: string) => void;
}

function FlashCardCell({ cell, editable, onUpdate }: Props) {
	const flashCard = JSON.parse(cell.content) as FlashCard;

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
