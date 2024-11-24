import Cell from "../../entities/cell";
import RichTextEditor from "../../ui/richTextEditor/RichTextEditor";
import FlashCardCell from "./FlashCardCell";

interface IProps {
    cell: Cell,
    editable: boolean,
    onUpdate: (content: string) => void,
}

function EditorCell({ cell, editable, onUpdate }: IProps) {
    switch (cell.cellType) {
        case "FlashCard":
            return <FlashCardCell cell={cell} onUpdate={onUpdate} editable={editable} />;
        case "Note":
            return <RichTextEditor
                content={cell.content}
                onUpdate={onUpdate}
                editable={editable} />;
    }
}

export default EditorCell;
