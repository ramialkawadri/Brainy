import { useCallback, useEffect, useRef, useState } from "react";
import useOutsideClick from "../../hooks/useOutsideClick";
import createDefaultCell from "../../util/createDefaultCell";
import TitleBar from "./TitleBar";
import styles from "./styles.module.css";
import ConfirmationDialog from "../../ui/ConfirmationDialog/ConfirmationDialog";
import useAppSelector from "../../hooks/useAppSelector";
import { selectSelectedFileId } from "../../store/selectors/fileSystemSelectors";
import Cell, {
	CellType,
	cellTypesDisplayNames,
} from "../../type/backend/entity/cell";
import FocusTools from "./FocusTools";
import NewCellTypeSelector from "./NewCellTypeSelector";
import Icon from "@mdi/react";
import getCellIcon from "../../util/getCellIcon";
import EditorCell from "../EditorCell/EditorCell";
import { mdiPlus } from "@mdi/js";
import FileRepetitionCounts from "../../type/backend/model/fileRepetitionCounts";
import useBeforeUnload from "../../hooks/useBeforeUnload";
import {
	createCell,
	deleteCell,
	getFileCellsOrderedByIndex,
	moveCell,
	updateCellContent,
} from "../../api/cellApi";
import { getStudyRepetitionCounts } from "../../api/repetitionApi";
import errorToString from "../../util/errorToString";
import { Editor as TipTapEditor } from "@tiptap/react";

const autoSaveDelayInMilliSeconds = 2000;
const oneMinuteInMilliSeconds = 60 * 1000;

interface Props {
	editCellId: number | null;
	onError: (error: string) => void;
	onStudyStart: () => void;
}

function Editor({ editCellId, onError, onStudyStart }: Props) {
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
	const tipTapEditorRef = useRef<TipTapEditor | null>(null);
	const selectedFileId = useAppSelector(selectSelectedFileId)!;
	const addNewCellPopupRef = useRef<HTMLDivElement>(null);
	const editorRef = useRef<HTMLDivElement>(null);
	const autoSaveTimeoutId = useRef(-1);
	// Used to store the ids of the changed cells so that we update them all
	// together instead of updating one by one.
	const changedCellsIds = useRef(new Set<number>());

	useOutsideClick(editorRef as React.RefObject<HTMLElement>, () =>
		setShowInsertNewCell(false),
	);
	useOutsideClick(addNewCellPopupRef as React.RefObject<HTMLElement>, () =>
		setShowAddNewCellPopup(false),
	);

	useEffect(() => {
		if (
			tipTapEditorRef.current &&
			!showInsertNewCell &&
			!showAddNewCellPopup &&
			!showDeleteDialog
		) {
			tipTapEditorRef.current.commands.focus();
		}
	}, [showInsertNewCell, showAddNewCellPopup, showDeleteDialog]);

	useEffect(() => {
		void (async () => {
			await forceSave();
			await retrieveRepetitionCounts();
			const cells = await retrieveSelectedFileCells();
			if (cells && cells.length > 0) {
				console.log(editCellId);
				if (editCellId !== null) setSelectedCellId(editCellId);
				else setSelectedCellId(cells[0].id!);
			}
		})();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFileId]);

	useEffect(() => {
		if (tipTapEditorRef.current)
			tipTapEditorRef.current.commands.scrollIntoView();
	}, [selectedCellId]);

	useBeforeUnload(e => {
		void forceSave();
		if (changedCellsIds.current.size > 0) e.preventDefault();
	});

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setShowAddNewCellPopup(false);
			setShowInsertNewCell(false);
		} else if (e.ctrlKey && e.shiftKey && e.code === "Enter") {
			setShowInsertNewCell(!showInsertNewCell);
		} else if (e.ctrlKey && e.code === "Enter") {
			setShowAddNewCellPopup(!showAddNewCellPopup);
		} else if (e.code === "F5") {
			e.preventDefault();
			void startStudy();
		} else if (e.ctrlKey && e.altKey && e.code == "ArrowDown") {
			e.preventDefault();
			void moveCurrentCellByNumber(1);
		} else if (e.ctrlKey && e.altKey && e.code == "ArrowUp") {
			e.preventDefault();
			void moveCurrentCellByNumber(-1);
		} else if (e.ctrlKey && e.code == "ArrowDown") {
			e.preventDefault();
			const selectedCellIndex = cells.findIndex(
				c => c.id === selectedCellId,
			);
			setSelectedCellId(
				cells[Math.min(cells.length - 1, selectedCellIndex + 1)].id!,
			);
		} else if (e.ctrlKey && e.code == "ArrowUp") {
			e.preventDefault();
			const selectedCellIndex = cells.findIndex(
				c => c.id === selectedCellId,
			);
			setSelectedCellId(cells[Math.max(0, selectedCellIndex - 1)].id!);
		} else if (e.altKey && e.code === "Delete") {
			if (selectedCellId !== null) setShowDeleteDialog(true);
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
		return await executeRequest(async () => {
			const fetchedCells =
				await getFileCellsOrderedByIndex(selectedFileId);
			setCells(fetchedCells);
			return fetchedCells;
		});
	}, [executeRequest, selectedFileId]);

	const saveChanges = async (cells: Cell[]) => {
		await executeRequest(async () => {
			for (const id of changedCellsIds.current) {
				const cell = cells.find(c => c.id === id);
				if (!cell) continue;
				await updateCellContent(id, cell.content);
			}
			changedCellsIds.current.clear();
			await retrieveRepetitionCounts();
		});
	};

	useEffect(() => {
		const intervalId = setInterval(
			retrieveRepetitionCounts,
			oneMinuteInMilliSeconds,
		);
		return () => clearInterval(intervalId);
	}, [retrieveRepetitionCounts]);

	const handleUpdate = (content: string, index: number, id: number) => {
		changedCellsIds.current.add(id);
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

	const insertNewCell = async (cellType: CellType, index: number) => {
		const cell = createDefaultCell(cellType, selectedFileId, index);
		await executeRequest(async () => await createCell(cell));
		const cells = await retrieveSelectedFileCells();
		if (cells) setSelectedCellId(cells[index].id!);
		await retrieveRepetitionCounts();
		setShowInsertNewCell(false);
		setShowAddNewCellPopup(false);
	};

	const handleCellDeleteConfirm = async () => {
		setShowDeleteDialog(false);
		const cellIndex = cells.findIndex(c => c.id === selectedCellId);
		await executeRequest(async () => await deleteCell(selectedCellId!));
		await retrieveRepetitionCounts();
		await retrieveSelectedFileCells();
		tipTapEditorRef.current = null;
		if (cellIndex > 0) {
			setSelectedCellId(cellIndex > 0 ? cells[cellIndex - 1].id! : null);
		} else if (cellIndex === 0 && cells.length > 1) {
			setSelectedCellId(cells[1].id!);
		} else {
			setSelectedCellId(null);
		}
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
		await executeRequest(async () => await moveCell(draggedCellId, index));
		await retrieveSelectedFileCells();
		setDragOverCellId(null);
		setDraggedCellId(null);
	};

	const startStudy = async () => {
		await forceSave();
		onStudyStart();
	};

	const handleCellClick = (cellId: number) => {
		if (cellId === selectedCellId && tipTapEditorRef.current) {
			tipTapEditorRef.current.commands.focus();
		} else {
			setSelectedCellId(cellId);
		}
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
						onClick={() => handleCellClick(cell.id!)}
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
									void insertNewCell(cellType, i + 1)
								}
							/>
						)}

						<div className={styles.cellTitle}>
							<Icon path={getCellIcon(cell.cellType)} size={1} />
							<span>{cellTypesDisplayNames[cell.cellType]}</span>
						</div>

						<EditorCell
							cell={cell}
							editable={draggedCellId === null}
							autofocus={selectedCellId === cell.id}
							onUpdate={content =>
								handleUpdate(content, i, cell.id!)
							}
							onFocus={editor =>
								(tipTapEditorRef.current = editor)
							}
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
