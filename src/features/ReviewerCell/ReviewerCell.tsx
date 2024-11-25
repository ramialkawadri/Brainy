import Cell from "../../entities/cell";
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
