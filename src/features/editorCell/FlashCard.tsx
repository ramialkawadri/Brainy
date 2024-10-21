import { CellInfoDto } from "../../services/backendApi";
import IFlashCard from "../../types/cells/FlashCard";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import styles from "./styles.module.css";

interface IProps {
    cellInfo: CellInfoDto,
    editable: boolean,
    onUpdate: (flashCard: IFlashCard) => void,
}

function FlashCard({ cellInfo, onUpdate, editable }: IProps) {
    const flashCard = cellInfo.data as IFlashCard;

    const handleQuestionUpdate = (html: string) =>
        onUpdate({
            question: html,
            answer: flashCard.answer,
        });

    const handleAnswerUpdate = (html: string) => 
        onUpdate({
            question: flashCard.question,
            answer: html,
        });

    return (
        <div className={styles.flashCard}>
            <RichTextEditor title="Question"
                content={flashCard.question} onUpdate={handleQuestionUpdate}
                editable={editable} />
            <RichTextEditor title="Answer"
                content={flashCard.answer} onUpdate={handleAnswerUpdate}
                editable={editable} />
        </div>
    );
}

export default FlashCard;
