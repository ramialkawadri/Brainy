import ICell from "../../entities/cell";
import RichTextEditor from "../../ui/richTextEditor/RichTextEditor";
import FlashCard from "./FlashCard";

interface IProps {
    cell: ICell,
    editable: boolean,
    onUpdate: (content: string) => void,
}

function EditorCell({ cell, editable, onUpdate }: IProps) {
    switch (cell.cellType) {
        case "FlashCard":
            return <FlashCard cell={cell} onUpdate={onUpdate} editable={editable} />;
        case "Note":
            return <RichTextEditor
                content={cell.content} onUpdate={onUpdate} editable={editable} />;
    }
}

export default EditorCell;
