import { useCallback, useEffect, useRef, useState } from "react";
import useOutsideClick from "../../hooks/useOutsideClick";
import createDefaultCell from "../../util/createDefaultCell";
import TitleBar from "./TitleBar";
import styles from "./styles.module.css";
import ConfirmationDialog from "../../ui/ConfirmationDialog/ConfirmationDialog";
import useAppSelector from "../../hooks/useAppSelector";
import { selectSelectedFileId } from "../../store/selectors/fileSystemSelectors";
import Cell, { CellType } from "../../type/backend/entity/cell";
import FocusTools from "./FocusTools";
import NewCellTypeSelector from "./NewCellTypeSelector";
import Icon from "@mdi/react";
import getCellIcon from "../../util/getCellIcon";
import EditorCell from "../EditorCell/EditorCell";
import { mdiPlus } from "@mdi/js";
import FileRepetitionCounts from "../../type/backend/model/fileRepetitionCounts";
import useBeforeUnload from "../../hooks/useBeforeUnload";
import {
	// TODO: wrap all by execute async
	createCell,
	deleteCell,
	getFileCellsOrderedByIndex,
	moveCell,
	updateCellContent,
} from "../../api/cellApi";
import { getStudyRepetitionCounts } from "../../api/repetitionApi";
import errorToString from "../../util/errorToString";

const autoSaveDelayInMilliSeconds = 2000;

interface Props {
	onError: (error: string) => void;
	onStudyStart: () => void;
}

function Editor({ onError, onStudyStart }: Props) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	// Used for the focus tools.
	const [showInsertNewCell, setShowInsertNewCell] = useState(false);
	// Used for the add button at the end.
	const [showAddNewCellPopup, setShowAddNewCellPopup] = useState(false);
	const [selectedCellId, setSelectedCellId] = useState<number | null>(null);
	const [draggedCellId, setDraggedCellId] = useState<number | null>(null);
	const [dragOverCellId, setDragOverCellId] = useState<number | null>(null);
	const [repetitionCounts, setRepetitionCounts] =
		useState<FileRepetitionCounts>({
			new: 0,
			learning: 0,
			relearning: 0,
			review: 0,
		});
	const [cells, setCells] = useState<Cell[]>([]);
	const selectedFileId = useAppSelector(selectSelectedFileId)!;
	const addNewCellPopupRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<HTMLDivElement>(null);
	const autoSaveTimeoutId = useRef(-1);
	// Used to store the ids of the changed cells so that we update them all
	// together instead of updating one by one.
	const changedCellsIndices = useRef(new Set<number>());

	useOutsideClick(editorRef as React.RefObject<HTMLElement>, () =>
		setShowInsertNewCell(false),
	);
	useOutsideClick(addNewCellPopupRef as React.RefObject<HTMLElement>, () =>
		setShowAddNewCellPopup(false),
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setShowAddNewCellPopup(false);
			setShowInsertNewCell(false);
		} else if (e.ctrlKey && e.shiftKey && e.code === "Enter") {
			setShowInsertNewCell(!showInsertNewCell);
		} else if (e.ctrlKey && e.code === "Enter") {
			setShowAddNewCellPopup(!showAddNewCellPopup);
		} else if (e.code === "F5") {
			void startStudy();
		} else if (e.ctrlKey && e.altKey && e.code == "ArrowDown") {
			e.preventDefault();
			void moveCurrentCellByNumber(1);
		} else if (e.ctrlKey && e.altKey && e.code == "ArrowUp") {
			e.preventDefault();
			void moveCurrentCellByNumber(-1);
		} else if (e.ctrlKey && e.code == "ArrowDown") {
			e.preventDefault();
            const selectedCellIndex = cells.findIndex(c => c.id === selectedCellId);
			setSelectedCellId(
				cells[Math.min(cells.length - 1, selectedCellIndex + 1)].id!,
			);
		} else if (e.ctrlKey && e.code == "ArrowUp") {
			e.preventDefault();
            const selectedCellIndex = cells.findIndex(c => c.id === selectedCellId);
			setSelectedCellId(
				cells[Math.max(0, selectedCellIndex - 1)].id!,
			);
		}
	};

	const moveCurrentCellByNumber = async (number: number) => {
        const selectedCellIndex = cells.findIndex(c => c.id === selectedCellId);
		if (
			0 <= selectedCellIndex + number &&
			selectedCellIndex + number < cells.length
		) {
			await executeRequest(async () => {
				await moveCell(
					cells[selectedCellIndex].id!,
					selectedCellIndex + (number > 0 ? number + 1 : number),
				);
			});
            await retrieveSelectedFileCells();
		}
	};

	const executeRequest = useCallback(
		async <T,>(cb: () => Promise<T>) => {
			try {
				return await cb();
			} catch (e) {
				console.error(e);
				onError(errorToString(e));
			}
		},
		[onError],
	);

	const retrieveRepetitionCounts = useCallback(async () => {
		await executeRequest(async () => {
			const repetitionCounts =
				await getStudyRepetitionCounts(selectedFileId);
			setRepetitionCounts(repetitionCounts);
		});
	}, [executeRequest, selectedFileId]);

	const retrieveSelectedFileCells = useCallback(async () => {
		await executeRequest(async () => {
			const fetchedCells =
				await getFileCellsOrderedByIndex(selectedFileId);
			setCells(fetchedCells);
		});
	}, [executeRequest, selectedFileId]);

	const saveChanges = async (cells: Cell[]) => {
		await executeRequest(async () => {
			for (const index of changedCellsIndices.current) {
				await updateCellContent(cells[index].id!, cells[index].content);
			}
			changedCellsIndices.current.clear();
			await retrieveRepetitionCounts();
		});
	};

	const handleUpdate = (content: string, index: number) => {
		changedCellsIndices.current.add(index);
		const newCells = [...cells];
		newCells[index] = {
			...cells[index],
			content,
		};
		setCells(newCells);

		if (autoSaveTimeoutId.current !== -1) {
			clearTimeout(autoSaveTimeoutId.current);
		}
		autoSaveTimeoutId.current = setTimeout(() => {
			void saveChanges(newCells);
			autoSaveTimeoutId.current = -1;
		}, autoSaveDelayInMilliSeconds);
	};

	const forceSave = async () => {
		if (autoSaveTimeoutId.current !== -1) {
			clearTimeout(autoSaveTimeoutId.current);
		}
		await saveChanges(cells);
	};

	useEffect(() => {
		void (async () => {
			await forceSave();
			await retrieveRepetitionCounts();
			await retrieveSelectedFileCells();
		})();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFileId]);

	useBeforeUnload(e => {
		void forceSave();
		if (changedCellsIndices.current.size > 0) e.preventDefault();
	});

	const insertNewCell = async (cellType: CellType, index: number) => {
		const cell = createDefaultCell(cellType, selectedFileId, index);
		await createCell(cell);
		await retrieveSelectedFileCells();
		await retrieveRepetitionCounts();
		setShowInsertNewCell(false);
		setShowAddNewCellPopup(false);
	};

	const handleCellDeleteConfirm = async () => {
		setShowDeleteDialog(false);
		await deleteCell(selectedCellId!);
		await retrieveSelectedFileCells();
		await retrieveRepetitionCounts();
	};

	const selectCell = (id: number) => {
		if (selectedCellId !== id) {
			setShowInsertNewCell(false);
			setSelectedCellId(id);
		}
	};

	const handleDragStart = (e: React.DragEvent, id: number) => {
		e.stopPropagation();
		// Setting anything in the data transfer so that drag over works,
		// but the index is stored in the state.
		e.dataTransfer.setData("tmp", "tmp");
		setDraggedCellId(id);
	};

	const handleDragOver = (e: React.DragEvent, id: number) => {
		if (draggedCellId === null || id === draggedCellId) {
			return;
		}
		e.preventDefault();
		setDragOverCellId(id);
	};

	const handleDrop = async (index: number) => {

		if (draggedCellId === null) return;
        const draggedCellIndex = cells.findIndex(c => c.id === draggedCellId);
        if (index === draggedCellIndex) return;
		await moveCell(draggedCellId, index);
		await retrieveSelectedFileCells();
        setDragOverCellId(null);
		setDraggedCellId(null);
	};

	const startStudy = async () => {
		await forceSave();
		onStudyStart();
	};

	return (
		<div className={styles.container} onKeyDown={handleKeyDown}>
			{showDeleteDialog && (
				<ConfirmationDialog
					text="Are you sure you want to delete the cell?"
					title="Delete Cell"
					onCancel={() => setShowDeleteDialog(false)}
					onConfirm={() => void handleCellDeleteConfirm()}
				/>
			)}

			<TitleBar
				repetitionCounts={repetitionCounts}
				onStudyButtonClick={() => void startStudy()}
			/>

			<div
				className={`container ${styles.editorContainer}`}
				ref={editorRef}>
				{cells.length === 0 && <p>The file is empty</p>}

				{cells.map((cell, i) => (
					<div
						key={cell.id}
						onFocus={() => selectCell(cell.id!)}
						onClick={() => selectCell(cell.id!)}
						onDragOver={e => handleDragOver(e, cell.id!)}
						onDragLeave={() => setDragOverCellId(null)}
						onDrop={() => void handleDrop(i)}
						className={`${styles.cell}
                            ${selectedCellId === cell.id ? styles.selectedCell : ""}
                            ${dragOverCellId === cell.id ? styles.dragOver : ""}
                            ${draggedCellId === cell.id ? styles.dragging : ""}`}>
						{selectedCellId === cell.id && (
							<FocusTools
								onInsert={() =>
									setShowInsertNewCell(!showInsertNewCell)
								}
								onDelete={() => setShowDeleteDialog(true)}
								onDragStart={e => handleDragStart(e, cell.id!)}
								onDragEnd={() => setDraggedCellId(null)}
							/>
						)}

						{showInsertNewCell && selectedCellId === cell.id && (
							<NewCellTypeSelector
								className={styles.insertCellPopup}
								onClick={cellType =>
									void insertNewCell(cellType, i)
								}
							/>
						)}

						<div className={styles.cellTitle}>
							<Icon path={getCellIcon(cell.cellType)} size={1} />
							<span>{cell.cellType}</span>
						</div>

						<EditorCell
							cell={cell}
							editable={draggedCellId === null}
							autofocus={selectedCellId === cell.id}
							onUpdate={content => handleUpdate(content, i)}
						/>
					</div>
				))}

				<div
					className={`${styles.addButtonContainer}
                        ${dragOverCellId === cells.length ? styles.dragOver : ""}`}
					onDragOver={e => handleDragOver(e, cells.length)}
					onDrop={() => void handleDrop(cells.length)}
					onDragLeave={() => setDragOverCellId(null)}>
					<button
						className={`${styles.addButton} grey-button`}
						onClick={() => setShowAddNewCellPopup(true)}>
						<Icon path={mdiPlus} size={1} />
						<span title="Ctrl + Enter">Add Cell</span>
					</button>
				</div>

				{showAddNewCellPopup && (
					<div className="overlay">
						<NewCellTypeSelector
							className={styles.overlayCellSelector}
							onClick={cellType =>
								void insertNewCell(cellType, cells.length)
							}
							ref={addNewCellPopupRef}
						/>
					</div>
				)}
			</div>
		</div>
	);
}

export default Editor;
