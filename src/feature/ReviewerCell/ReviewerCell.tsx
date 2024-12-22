import Cell from "../../type/backend/entity/cell";
import Repetition from "../../type/backend/entity/repetition";
import ClozeReviewView from "./Cloze";
import FlashCardReviewView from "./FlashCardReviewView";

interface Props {
	cell: Cell;
	showAnswer: boolean;
	repetition: Repetition;
}

function ReviewerCell({ cell, showAnswer, repetition }: Props) {
	switch (cell.cellType) {
		case "FlashCard":
			return <FlashCardReviewView cell={cell} showAnswer={showAnswer} />;
		case "Cloze":
			return (
				<ClozeReviewView
					cell={cell}
					showAnswer={showAnswer}
					repetition={repetition}
				/>
			);
	}
}

export default ReviewerCell;
