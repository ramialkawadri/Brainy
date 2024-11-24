import Cell from "../../entities/cell";
import FlashCard from "./FlashCard";

interface IProps {
    cell: Cell,
    showAnswer: boolean,
};

function ReviewerCell({ cell, showAnswer }: IProps) {
    switch (cell.cellType) {
        case "FlashCard":
            return <FlashCard cell={cell} showAnswer={showAnswer} />
    }
}

export default ReviewerCell;
