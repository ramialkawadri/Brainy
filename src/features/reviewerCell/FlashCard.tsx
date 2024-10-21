import { CellInfoDto } from "../../services/backendApi";
import IFlashCard from "../../types/cells/FlashCard";

interface IProps {
    cellInfo: CellInfoDto,
    showAnswer: boolean,
};

function FlashCard({ cellInfo, showAnswer }: IProps) {
    const flashCard = cellInfo.data as IFlashCard;

    return (
        <>
            <div dangerouslySetInnerHTML={{__html: flashCard.question}} />
            <hr />
            {showAnswer &&
                <div dangerouslySetInnerHTML={{__html: flashCard.answer}} />}
        </>
    );
}

export default FlashCard;
