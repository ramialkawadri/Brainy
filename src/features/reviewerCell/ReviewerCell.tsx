import { CellInfoDto, CellType } from "../../services/backendApi";
import FlashCard from "./FlashCard";

interface IProps {
    cellInfo: CellInfoDto,
    showAnswer: boolean,
};

function ReviewerCell({ cellInfo, showAnswer }: IProps) {
    switch (cellInfo.type) {
        case CellType.FlashCard:
            return <FlashCard cellInfo={cellInfo} showAnswer={showAnswer} />
    }
}

export default ReviewerCell;
