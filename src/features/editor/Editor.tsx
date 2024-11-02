import { useCallback, useEffect, useRef, useState } from "react";
import useGlobalKey from "../../hooks/useGlobalKey";
import useOutsideClick from "../../hooks/useOutsideClick";
import createDefaultCell from "../../utils/createDefaultCell";
import TitleBar from "./TitleBar";
import styles from "./styles.module.css";
import ConfirmationDialog from "../../ui/confirmationDialog/ConfirmationDialog";
import { invoke } from "@tauri-apps/api/core";
import useAppSelector from "../../hooks/useAppSelector";
import { selectSelectedFileId } from "../../store/selectors/fileSystemSelectors";
import ICell, { CellType } from "../../entities/cell";
import FocusTools from "./FocusTools";
import NewCellTypeSelector from "./NewCellTypeSelector";
import Icon from "@mdi/react";
import getCellIcon from "../../utils/getCellIcon";
import EditorCell from "../editorCell/EditorCell";
import { mdiPlus } from "@mdi/js";

function Editor() {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    // Used for the focus tools.
    const [showInsertNewCell, setShowInsertNewCell] = useState(false);
    // Used for the insert button.
    const [showAddNewCellPopup, setShowAddNewCellPopup] = useState(false);
    const [selectedCellIndex, setSelectedCellIndex] = useState(0);
    const [draggedCellIndex, setDraggedCellIndex] = useState(-1);
    const [dragOverCellIndex, setDragOverCellIndex] = useState(-1);
    const selectedFileId = useAppSelector(selectSelectedFileId)!;
    const addNewCellPopupRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);
    const [cells, setCells] = useState<ICell[]>([]);

    useOutsideClick(editorRef as React.MutableRefObject<HTMLElement>,
        () => setShowInsertNewCell(false));
    useOutsideClick(addNewCellPopupRef as React.MutableRefObject<HTMLElement>,
        () => setShowAddNewCellPopup(false));
    useGlobalKey(e => {
        if (e.key === "Escape" && showAddNewCellPopup) {
            setShowAddNewCellPopup(false);
        }
    });

    const fetchUserFiles = useCallback(async () => {
        // TODO: handle exception
        const result: ICell[] = await invoke("get_cells", {
            fileId: selectedFileId
        });
        setCells(result);
    }, [selectedFileId, setCells]);

    const insertNewCell = async (cellType: CellType, index = -1) => {
        // TODO: handle exception
        await invoke("create_cell", {
            ...createDefaultCell(cellType, selectedFileId, index)
        });
        await fetchUserFiles();
        setShowInsertNewCell(false);
        setShowAddNewCellPopup(false);
    };

    useEffect(() => {
        void fetchUserFiles();
    }, [fetchUserFiles]);

    const handleCellUpdate = useCallback((cellInfo: CellInfoDto, index: number) => {
        const newArray = [...cells];
        newArray[index] = cellInfo;
        onUpdate(newArray);
    }, []);

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

            {/*TODO:*/}
            <TitleBar
                isSaving={false}
                repetitionCounts={[]}
                onSave={() => {}}
                onStudyButtonClick={() => {}} />

            <div className={`container ${styles.editorContainer}`} ref={editorRef}>
                {cells.map((cell, i) =>
                    <div key={cell.id}
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
                                onClick={(cellType) => void insertNewCell(cellType, i)}/>}

                        <div className={styles.cellTitle}>
                            <Icon path={getCellIcon(cell.cellType)} size={1} />
                            <span>{cell.cellType}</span>
                        </div>

                        <EditorCell
                            cell={cell}
                            // onUpdate={(cellInfo) => handleCellUpdate(cellInfo, i)}
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
                            onClick={(cellType) => void insertNewCell(cellType, cells.length)}
                            ref={addNewCellPopupRef} />
                    </div>}
            </div>
        </div>
    );
}

export default Editor;
