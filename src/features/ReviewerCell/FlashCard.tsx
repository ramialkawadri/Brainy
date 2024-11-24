import Cell from "../../entities/cell";
// TODO: better
import FlashCardType from "../../types/flashCard";

interface Props {
	cell: Cell;
	showAnswer: boolean;
}

function FlashCard({ cell, showAnswer }: Props) {
	const flashCard = JSON.parse(cell.content) as FlashCardType;

	return (
		<>
			<div dangerouslySetInnerHTML={{ __html: flashCard.question }} />
			<hr />
			{showAnswer && <div dangerouslySetInnerHTML={{ __html: flashCard.answer }} />}
		</>
	);
}

export default FlashCard;
