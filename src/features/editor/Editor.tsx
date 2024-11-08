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
import Cell, { CellType } from "../../entities/cell";
import FocusTools from "./FocusTools";
import NewCellTypeSelector from "./NewCellTypeSelector";
import Icon from "@mdi/react";
import getCellIcon from "../../utils/getCellIcon";
import EditorCell from "../editorCell/EditorCell";
import { mdiPlus } from "@mdi/js";
import FileRepetitionCounts from "../../entities/fileRepetitionCounts";

interface IProps {
    cells: Cell[],
    onCellsUpdate: (cells: Cell[]) => void,
    onError: (error: string) => void,
    // TODO: seperate the title bar from the editor
    onStudyButtonClick: () => void,
    // TODO: find better name
    fetchFileCells: () => Promise<void>,
}

function Editor({ cells, onError, onCellsUpdate, fetchFileCells, onStudyButtonClick }: IProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    // Used for the focus tools.
    const [showInsertNewCell, setShowInsertNewCell] = useState(false);
    // Used for the insert button.
    const [showAddNewCellPopup, setShowAddNewCellPopup] = useState(false);
    const [selectedCellIndex, setSelectedCellIndex] = useState(0);
    const [draggedCellIndex, setDraggedCellIndex] = useState(-1);
    const [dragOverCellIndex, setDragOverCellIndex] = useState(-1);
    const [repetitionCounts, setRepetitionCounts] = useState<FileRepetitionCounts>({
        new: 0, learning: 0, relearning: 0, review: 0,
    });
    const selectedFileId = useAppSelector(selectSelectedFileId)!;
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

    useEffect(() => {
        void (async () => {
            setRepetitionCounts(await invoke("get_file_repetitions_count", {
                fileId: selectedFileId
            }));
        })();

        // We need to refetch the count on cells or file changing!
    }, [selectedFileId, cells]);

    const handleUpdate = async (cell: Cell, content: string, index: number) => {
        await executeRequest(async () => {
            await invoke("update_cell", {
                cellId: cell.id,
                content,
            });
            cells[index].content = content;
            onCellsUpdate(cells);
        });
    };

    const executeRequest = useCallback(async (cb: () => Promise<unknown>) => {
        try {
            await cb();
        } catch (e) {
            console.error(e);
            if (e instanceof Error) onError(e.message);
            else onError(e as string);
        }
    }, [onError]);

    const insertNewCell = async (cellType: CellType, index = -1) => {
        await executeRequest(async () => {
            await invoke("create_cell", {
                ...createDefaultCell(cellType, selectedFileId, index)
            });
            await fetchFileCells();
            setShowInsertNewCell(false);
            setShowAddNewCellPopup(false);
        });
    };

    const handleCellDeleteConfirm = async () => {
        await executeRequest(async () => {
            setShowDeleteDialog(false);
            await invoke("delete_cell", { cellId: cells[selectedCellIndex].id });
            await fetchFileCells();
        });
    };

    const selectCell = (index: number) => {
        if (selectedCellIndex !== index) {
            setShowInsertNewCell(false);
            setSelectedCellIndex(index);
        }
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.stopPropagation();
        // Setting anything in the data transfer so that drag over works,
        // but the index is stored in the state.
        e.dataTransfer.setData("tmp", "tmp");
        setDraggedCellIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        if (draggedCellIndex === -1 || index === draggedCellIndex) {
            return;
        }
        e.preventDefault();
        setDragOverCellIndex(index);
    };

    const handleDrop = async (index: number) => {
        await executeRequest(async () => {
            if (draggedCellIndex === -1 || index === draggedCellIndex) {
                return;
            }
            setDragOverCellIndex(-1);
            await invoke("move_cell", {
                cellId: cells[draggedCellIndex].id,
                newIndex: index,
            });
            await fetchFileCells();
            const dropIndex = index > draggedCellIndex ? index - 1 : index;
            if (selectedCellIndex === draggedCellIndex) {
                setSelectedCellIndex(dropIndex);
            }
            setDraggedCellIndex(-1);
        });
    };

    // TODO: autofocus on text field when changing focus
    return (
        <div className={styles.container}>
            {showDeleteDialog && <ConfirmationDialog
                text="Are you sure you want to delete the cell?"
                title="Delete Cell" onCancel={() => setShowDeleteDialog(false)}
                onConfirm={() => void handleCellDeleteConfirm()} />}

            <TitleBar
                repetitionCounts={repetitionCounts}
                onStudyButtonClick={onStudyButtonClick} />

            <div className={`container ${styles.editorContainer}`} ref={editorRef}>
                {cells.length === 0 && <p>The file is empty</p>}

                {cells.map((cell, i) =>
                    <div key={cell.id}
                        onFocus={() => selectCell(i)}
                        onClick={() => selectCell(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDragLeave={() => setDragOverCellIndex(-1)}
                        onDrop={() => void handleDrop(i)}
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
                            editable={draggedCellIndex === -1}
                            onUpdate={content => void handleUpdate(cell, content, i)} />
                    </div>
                )}
                
                <div
                    className={`${styles.addButtonContainer}
                        ${dragOverCellIndex === cells.length ? styles.dragOver : ""}`}
                    onDragOver={(e) => handleDragOver(e, cells.length)}
                    onDrop={() => void handleDrop(cells.length)}
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
