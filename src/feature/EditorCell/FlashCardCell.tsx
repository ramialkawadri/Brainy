import Cell from "../../type/backend/entity/cell";
import FlashCard from "../../type/flashCard";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import styles from "./styles.module.css";

interface Props {
	cell: Cell;
	editable: boolean;
    autofocus: boolean;
	onUpdate: (content: string) => void;
}

function FlashCardCell({ cell, editable, autofocus, onUpdate }: Props) {
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
                autofocus={autofocus}
			/>
			<RichTextEditor
				title="Answer"
				content={flashCard.answer}
                autofocus={false}
                editable={editable}
				onUpdate={handleAnswerUpdate}
			/>
		</div>
	);
}

export default FlashCardCell;
