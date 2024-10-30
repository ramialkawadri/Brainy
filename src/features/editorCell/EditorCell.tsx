import ICell from "../../entities/cell";
import RichTextEditor from "../../ui/richTextEditor/RichTextEditor";
import FlashCard from "./FlashCard";

interface IProps {
    cell: ICell,
    editable: boolean,
}

function EditorCell({ cell, editable }: IProps) {
    const onUpdate = (cell: ICell) => {
        // TODO:
        console.log(cell);
    };

    switch (cell.cellType) {
        case "FlashCard":
            return <FlashCard
                cell={cell}
                onUpdate={data => onUpdate({...cell, content: JSON.stringify(data)})}
                editable={editable} />;
        case "Note":
            return <RichTextEditor
                content={cell.content}
                onUpdate={html => onUpdate({ ...cell, content: html })}
                editable={editable} />;
    }
}

export default EditorCell;
