import Cell from "../../entities/cell";
import FlashCard from "../../types/flashCard";
import RichTextEditor from "../../ui/richTextEditor/RichTextEditor";
import styles from "./styles.module.css";

interface IProps {
    cell: Cell,
    editable: boolean,
    onUpdate: (content: string) => void,
}

function FlashCardCell({ cell, onUpdate, editable }: IProps) {
    const flashCard = JSON.parse(cell.content) as FlashCard ?? {};

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

export default FlashCardCell;
