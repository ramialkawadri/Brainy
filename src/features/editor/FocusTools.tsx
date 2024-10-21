import { mdiDeleteOutline, mdiDrag, mdiPlus } from "@mdi/js";
import styles from "./styles.module.css";
import Icon from "@mdi/react";

interface IProps {
    onInsertCell: () => void,
    onDelete: () => void,
    onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void,
    onDragEnd: (e: React.DragEvent<HTMLButtonElement>) => void,
}

function FocusTools({ onInsertCell, onDelete, onDragStart, onDragEnd }: IProps) {
    return (
        <div className={styles.focusTools}>
            <button
                className="transparent"
                title="Insert Cell"
                onClick={onInsertCell}>
                <Icon path={mdiPlus} size={1} />
            </button>

            <button
                className={`transparent ${styles.delete}`}
                title="Delete cell"
                onClick={onDelete}>
                <Icon path={mdiDeleteOutline} size={1} />
            </button>

            <button tabIndex={-1}
                className={styles.drag}
                title="Drag cell"
                draggable
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}>
                <Icon path={mdiDrag} size={1} />
            </button>
        </div>
    )
}

export default FocusTools;
