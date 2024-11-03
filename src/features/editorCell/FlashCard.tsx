import ICell from "../../entities/cell";
import IFlashCard from "../../types/flashCard";
import RichTextEditor from "../../ui/richTextEditor/RichTextEditor";
import styles from "./styles.module.css";

interface IProps {
    cell: ICell,
    editable: boolean,
    onUpdate: (content: string) => void,
}

function FlashCard({ cell, onUpdate, editable }: IProps) {
    const flashCard = JSON.parse(cell.content) as IFlashCard ?? {};

    const handleQuestionUpdate = (html: string) =>
        onUpdate(JSON.stringify({
            question: html,
            answer: flashCard.answer,
        }));

    const handleAnswerUpdate = (html: string) => 
        onUpdate(JSON.stringify({
            question: flashCard.question,
            answer: html,
        }));

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
