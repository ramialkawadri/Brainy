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
import FileRepetitionCounts from "../../type/backend/model/fileRepetitionCounts";
import useBeforeUnload from "../../hooks/useBeforeUnload";
import {
	createCell,
	deleteCell,
	getFileCellsOrderedByIndex,
	moveCell,
	updateCellsContents,
} from "../../api/cellApi";
import {
	getFileRepetitions,
	getStudyRepetitionCounts,
} from "../../api/repetitionApi";
import errorToString from "../../util/errorToString";
import { Editor as TipTapEditor } from "@tiptap/react";
import { TauriEvent, UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import UpdateCellRequest from "../../type/backend/dto/updateCellRequest";
import AddCellContainer from "./AddCellContainer";
import Repetition from "../../type/backend/entity/repetition";

const autoSaveDelayInMilliSeconds = 2000;
const oneMinuteInMilliseconds = 60 * 1000;

interface Props {
	editCellId: number | null;
	onError: (error: string) => void;
	onStudyStart: () => void;
}

function Editor({ editCellId, onError, onStudyStart }: Props) {
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	// Used for the focus tools.
	const [showInsertNewCell, setShowInsertNewCell] = useState(false);
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
	const [repetitions, setRepetitions] = useState<Repetition[]>([]);
	// This ref is only used for keeping updated cells that are not yet saved.
	const updatedCells = useRef(cells);
	const tipTapEditorRef = useRef<TipTapEditor | null>(null);
	const selectedFileId = useAppSelector(selectSelectedFileId)!;
	const editorRef = useRef<HTMLDivElement>(null);
	const autoSaveTimeoutId = useRef<number>(null);
	// Used to store the ids of the changed cells so that we update them all
	// together instead of updating one by one.
	const changedCellsIds = useRef(new Set<number>());

	useOutsideClick(editorRef as React.RefObject<HTMLElement>, () =>
		setShowInsertNewCell(false),
	);

	// TODO: move from use effect to event code
	useEffect(() => {
		if (
			tipTapEditorRef.current &&
			!showInsertNewCell &&
			!showDeleteDialog
		) {
			tipTapEditorRef.current.commands.focus();
		}
	}, [showInsertNewCell, showDeleteDialog]);

	useEffect(() => {
		void (async () => {
			await forceSave();
			await retrieveRepetitionCounts();
			const cells = await retrieveSelectedFileCells();
			if (cells && cells.length > 0) {
				if (editCellId !== null) setSelectedCellId(editCellId);
				else setSelectedCellId(cells[0].id!);
			}
		})();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFileId]);

	// TODO: move from use effect to event code
	useEffect(() => {
		if (tipTapEditorRef.current)
			tipTapEditorRef.current.commands.scrollIntoView();
	}, [selectedCellId]);

	useEffect(() => {
		let unlisten: UnlistenFn;

		void (async () => {
			unlisten = await getCurrentWindow().listen(
				TauriEvent.WINDOW_CLOSE_REQUESTED,
				() => {
					if (changedCellsIds.current.size > 0) {
						void (async () => {
							await forceSave();
							await getCurrentWindow().destroy();
						})();
					} else {
						void getCurrentWindow().destroy();
					}
				},
			);
		})();

		return () => {
			if (unlisten) void unlisten();
		};
	});

	useBeforeUnload(e => {
		void forceSave();
		if (changedCellsIds.current.size > 0) e.preventDefault();
	});

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Escape") {
			setShowInsertNewCell(false);
		} else if (e.ctrlKey && e.shiftKey && e.code === "Enter") {
			setShowInsertNewCell(!showInsertNewCell);
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

	const saveChanges = useCallback(async () => {
		if (changedCellsIds.current.size === 0) return;

		await executeRequest(async () => {
			const requests: UpdateCellRequest[] = [];

			for (const id of changedCellsIds.current) {
				const cell = updatedCells.current.find(c => c.id === id);
				if (!cell) continue;
				requests.push({
					cellId: id,
					content: cell.content,
				});
			}

			await updateCellsContents(requests);
			changedCellsIds.current.clear();
			await retrieveRepetitionCounts();
			setCells(updatedCells.current);
			const fetchedRepetitions = await getFileRepetitions(selectedFileId);
			setRepetitions(fetchedRepetitions);
		});
	}, [executeRequest, retrieveRepetitionCounts, selectedFileId]);

	const forceSave = useCallback(async () => {
		if (autoSaveTimeoutId.current !== null) {
			clearTimeout(autoSaveTimeoutId.current);
			autoSaveTimeoutId.current = null;
		}
		await saveChanges();
	}, [saveChanges]);

	const retrieveSelectedFileCells = useCallback(async () => {
		return await executeRequest(async () => {
			await forceSave();
			const fetchedCells =
				await getFileCellsOrderedByIndex(selectedFileId);
			setCells(fetchedCells);
			const fetchedRepetitions = await getFileRepetitions(selectedFileId);
			setRepetitions(fetchedRepetitions);
			updatedCells.current = fetchedCells;
			return fetchedCells;
		});
	}, [executeRequest, forceSave, selectedFileId]);

	useEffect(() => {
		const intervalId = setInterval(
			retrieveRepetitionCounts,
			oneMinuteInMilliseconds,
		);
		return () => clearInterval(intervalId);
	}, [retrieveRepetitionCounts]);

	const handleUpdate = (content: string, index: number, id: number) => {
		changedCellsIds.current.add(id);
		const newCells = [...updatedCells.current];
		newCells[index] = {
			...updatedCells.current[index],
			content,
		};
		updatedCells.current = newCells;

		if (autoSaveTimeoutId.current !== null) {
			clearTimeout(autoSaveTimeoutId.current);
			autoSaveTimeoutId.current = null;
		}
		autoSaveTimeoutId.current = setTimeout(() => {
			void saveChanges();
			autoSaveTimeoutId.current = null;
		}, autoSaveDelayInMilliSeconds);
	};

	useEffect(() => {
		return () => void forceSave();
	}, [forceSave]);

	const insertNewCell = async (cellType: CellType, index: number) => {
		const cell = createDefaultCell(cellType, selectedFileId, index);
		await executeRequest(async () => await createCell(cell));
		const cells = await retrieveSelectedFileCells();
		if (cells) setSelectedCellId(cells[index].id!);
		await retrieveRepetitionCounts();
		setShowInsertNewCell(false);
	};

	const handleCellDeleteConfirm = async () => {
		changedCellsIds.current.delete(selectedCellId!);
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

    // TODO: different inner container width!!
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

			<div className={styles.outerEditorContainer}>
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
									onDragStart={e =>
										handleDragStart(e, cell.id!)
									}
									onDragEnd={() => setDraggedCellId(null)}
									repetitions={repetitions.filter(
										r => r.cellId === cell.id,
									)}
									cellType={cell.cellType}
								/>
							)}

							{showInsertNewCell &&
								selectedCellId === cell.id && (
									<NewCellTypeSelector
										className={styles.insertCellPopup}
										onClick={cellType =>
											void insertNewCell(cellType, i + 1)
										}
									/>
								)}

							<div className={styles.cellTitle}>
								<Icon
									path={getCellIcon(cell.cellType)}
									size={1}
								/>
								<span>
									{cellTypesDisplayNames[cell.cellType]}
								</span>
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

					<AddCellContainer
						isDragOver={dragOverCellId === cells.length}
						onDragOver={e => handleDragOver(e, cells.length)}
						onDrop={() => void handleDrop(cells.length)}
						onDragLeave={() => setDragOverCellId(null)}
						onAddNewCell={cellType =>
							void insertNewCell(cellType, cells.length)
						}
						onPopupHide={() =>
							tipTapEditorRef.current?.commands.focus()
						}
					/>
				</div>
			</div>
		</div>
	);
}

export default Editor;
