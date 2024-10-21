import { CellInfoDto, CellType } from "../../services/backendApi";
import RichTextEditor from "../../ui/RichTextEditor/RichTextEditor";
import FlashCard from "./FlashCard";

interface IProps {
    cellInfo: CellInfoDto,
    editable: boolean,
    onUpdate: (cellInfo: CellInfoDto) => void,
}

function EditorCell({ cellInfo, onUpdate, editable }: IProps) {
    switch (cellInfo.type) {
        case CellType.FlashCard:
            return <FlashCard cellInfo={cellInfo} onUpdate={
                data => onUpdate({...cellInfo, data })} editable={editable} />
        case CellType.Note:
            return <RichTextEditor content={String(cellInfo.data)}
                onUpdate={html => onUpdate({ ...cellInfo, data: html })}
                editable={editable} />;
    }
}

export default EditorCell;
