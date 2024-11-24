import Cell from "../../entities/cell";
import FlashCard from "./FlashCard";

interface Props {
	cell: Cell;
	showAnswer: boolean;
}

function ReviewerCell({ cell, showAnswer }: Props) {
	switch (cell.cellType) {
		case "FlashCard":
			return <FlashCard cell={cell} showAnswer={showAnswer} />;
	}
}

export default ReviewerCell;
