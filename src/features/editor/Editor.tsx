import { mdiPlus } from "@mdi/js";
import Icon from "@mdi/react";
import { useCallback, useRef, useState } from "react";
import useGlobalKey from "../../hooks/useGlobalKey";
import useOutsideClick from "../../hooks/useOutsideClick";
import createDefaultCell from "../../utils/createDefaultCell";
import getCellIcon from "../../utils/getCellIcon";
import FocusTools from "./FocusTools";
import NewCellTypeSelector from "./NewCellTypeSelector";
import TitleBar from "./TitleBar";
import styles from "./styles.module.css";
import EditorCell from "../editorCell/EditorCell";
import ConfirmationDialog from "../../ui/confirmationDialog/ConfirmationDialog";

interface IProps {
    title: string,
    cells: CellInfoDto[],
    isSaving: boolean,
    repetitionCounts: CellRepetitionCountsDto,
    onUpdate: (cells: CellInfoDto[]) => void,
    onSave: () => Promise<void>,
    onDelete: (index: number) => void,
    onStudyButtonClick: () => void
}

function Editor({
    title, cells, onUpdate, onSave,
    onDelete, isSaving, repetitionCounts,
    onStudyButtonClick }: IProps) {

    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    // Used for the focus tools.
    const [showInsertNewCell, setShowInsertNewCell] = useState(false);
    // Used for the insert button.
    const [showAddNewCellPopup, setShowAddNewCellPopup] = useState(false);
    const [selectedCellIndex, setSelectedCellIndex] = useState(0);
    const [draggedCellIndex, setDraggedCellIndex] = useState(-1);
    const [dragOverCellIndex, setDragOverCellIndex] = useState(-1);
    const addNewCellPopupRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    useOutsideClick(editorRef as React.MutableRefObject<HTMLElement>,
        () => setShowInsertNewCell(false));
    useOutsideClick(addNewCellPopupRef as React.MutableRefObject<HTMLElement>,
        () => setShowAddNewCellPopup(false));
    useGlobalKey(e => {
        if (e.key === "Escape" && showAddNewCellPopup) {
            setShowAddNewCellPopup(false);
        }
    });

    const handleCellUpdate = useCallback((cellInfo: CellInfoDto, index: number) => {
        const newArray = [...cells];
        newArray[index] = cellInfo;
        onUpdate(newArray);
    }, [cells, onUpdate]);

    const handleCellDeleteConfirm = () => {
        setShowDeleteDialog(false);
        onDelete(selectedCellIndex);
    };

    const selectCell = (index: number) => {
        if (selectedCellIndex !== index) {
            setShowInsertNewCell(false);
            setSelectedCellIndex(index);
        }
    };

    const insertNewCell = (cellType: CellType, index = -1) => {
        const insertIndex = index === -1 ? cells.length : index;
        const newArray = [...cells];
        newArray.splice(insertIndex, 0, createDefaultCell(cellType));
        onUpdate(newArray);
        setShowInsertNewCell(false);
        setShowAddNewCellPopup(false);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.stopPropagation();
        setDraggedCellIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        if (draggedCellIndex === -1 || index === draggedCellIndex) {
            return;
        }
        e.preventDefault();
        setDragOverCellIndex(index);
    };

    const handleDrop = (index: number) => {
        if (draggedCellIndex === -1 || index === draggedCellIndex) {
            return;
        }
        setDragOverCellIndex(-1);
        const element = cells[draggedCellIndex];
        const newCells = [...cells];
        const dropIndex = index > draggedCellIndex ? index - 1 : index;
        newCells.splice(draggedCellIndex, 1);
        newCells.splice(dropIndex, 0, element);
        onUpdate(newCells);

        if (selectedCellIndex === draggedCellIndex) {
            setSelectedCellIndex(dropIndex);
        }
        setDraggedCellIndex(-1);
    };

    return (
        <div className={styles.container}>
            {showDeleteDialog && <ConfirmationDialog
                text="Are you sure you want to delete the cell?"
                title="Delete Cell" onCancel={() => setShowDeleteDialog(false)}
                onConfirm={handleCellDeleteConfirm} />
            }

            <TitleBar
                title={title}
                isSaving={isSaving}
                repetitionCounts={repetitionCounts}
                onSave={onSave}
                onStudyButtonClick={onStudyButtonClick} />

            <div className={`container ${styles.editorContainer}`} ref={editorRef}>
                {cells.map((cellInfo, i) =>
                    <div key={cellInfo.id}
                        onFocus={() => selectCell(i)}
                        onClick={() => selectCell(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDragLeave={() => setDragOverCellIndex(-1)}
                        onDrop={() => handleDrop(i)}
                        className={`${styles.cell}
                            ${selectedCellIndex === i ? styles.selectedCell : "" }
                            ${dragOverCellIndex === i ? styles.dragOver : ""}
                            ${draggedCellIndex === i ? styles.dragging : ""}`}>

                        {selectedCellIndex === i &&
                            <FocusTools
                                onInsertCell={() => setShowInsertNewCell(!showInsertNewCell)}
                                onDelete={() => setShowDeleteDialog(true)}
                                onDragStart={e => handleDragStart(e, i)}
                                onDragEnd={() => setDraggedCellIndex(-1)} />}

                        {showInsertNewCell && selectedCellIndex === i &&
                            <NewCellTypeSelector
                                className={styles.insertCellPopup}
                                onClick={(cellType) => insertNewCell(cellType, i)}/>}

                        <div className={styles.cellTitle}>
                            <Icon path={getCellIcon(cellInfo.type!)} size={1} />
                            <span>{cellInfo.type}</span>
                        </div>

                        <EditorCell
                            cellInfo={cellInfo}
                            onUpdate={(cellInfo) => handleCellUpdate(cellInfo, i)}
                            editable={draggedCellIndex === -1} />
                    </div>
                )}

                <div
                    className={`${styles.addButtonContainer}
                        ${dragOverCellIndex === cells.length ? styles.dragOver : ""}`}
                    onDragOver={(e) => handleDragOver(e, cells.length)}
                    onDrop={() => handleDrop(cells.length)}
                    onDragLeave={() => setDragOverCellIndex(-1)}>
                    <button className={`${styles.addButton} grey-button`}
                        onClick={() => setShowAddNewCellPopup(true)}>
                        <Icon path={mdiPlus} size={1} />
                        <span>Add Cell</span>
                    </button>
                </div>

                {showAddNewCellPopup &&
                    <div className="overlay">
                        <NewCellTypeSelector
                            className={styles.overlayCellSelector}
                            onClick={(cellType) => insertNewCell(cellType)}
                            ref={addNewCellPopupRef} />
                    </div>
                }
            </div>
        </div>
    );
}

export default Editor;
