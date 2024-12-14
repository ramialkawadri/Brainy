import Cell from "../../type/backend/entity/cell";
import FlashCardReviewView from "./FlashCardReviewView";

interface Props {
	cell: Cell;
	showAnswer: boolean;
}

function ReviewerCell({ cell, showAnswer }: Props) {
	switch (cell.cellType) {
		case "FlashCard":
			return <FlashCardReviewView cell={cell} showAnswer={showAnswer} />;
	}
}

export default ReviewerCell;
