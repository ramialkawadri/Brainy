import { useCallback, useEffect, useRef, useState } from "react";
import createDefaultCell from "../../util/createDefaultCell";
import TitleBar from "./TitleBar";
import styles from "./styles.module.css";
import Cell, { CellType } from "../../type/backend/entity/cell";
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
import { TauriEvent, UnlistenFn } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import UpdateCellRequest from "../../type/backend/dto/updateCellRequest";
import AddCellContainer from "./AddCellContainer";
import Repetition from "../../type/backend/entity/repetition";
import RenderIfVisible from "../../ui/RenderIfVisible";
import useGlobalKey from "../../hooks/useGlobalKey";
import { useSearchParams } from "react-router";
import { fileIdQueryParameter } from "../../constants";
import CellBlock from "../CellBlock/CellBlock";

const autoSaveDelayInMilliSeconds = 2000;
const oneMinuteInMilliseconds = 60 * 1000;
export const CELL_ID_DRAG_FORMAT = "cell/id";

interface Props {
	editCellId: number | null;
	// TODO: move to global state?
	onError: (error: string) => void;
	onStudyStart: () => void;
}

function Editor({ editCellId, onError, onStudyStart }: Props) {
	// Used for the focus tools.
	const [selectedCellId, setSelectedCellId] = useState<number | null>(null);
	const [isDragOverAddCellContainer, setIsDragOverAddCellContainer] =
		useState(false);
	const [searchText, setSearchText] = useState("");
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
	const outerEditorContainerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);
	const [searchParams] = useSearchParams();
	const selectedFileId = Number(searchParams.get(fileIdQueryParameter));
	const autoSaveTimeoutId = useRef<number>(null);
	// Used to store the ids of the changed cells so that we update them all
	// together instead of updating one by one.
	const changedCellsIds = useRef(new Set<number>());
	const selectedCellRef = useRef<HTMLDivElement>(null);

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

	useEffect(() => {
		if (!searchText) {
			selectedCellRef.current?.scrollIntoView();
		}
	}, [searchText]);

	useBeforeUnload(e => {
		void forceSave();
		if (changedCellsIds.current.size > 0) e.preventDefault();
	});

	useGlobalKey(e => {
		if (e.code === "F5") {
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
			selectCell(
				cells[Math.min(cells.length - 1, selectedCellIndex + 1)].id!,
			);
		} else if (e.ctrlKey && e.code == "ArrowUp") {
			e.preventDefault();
			const selectedCellIndex = cells.findIndex(
				c => c.id === selectedCellId,
			);
			selectCell(cells[Math.max(0, selectedCellIndex - 1)].id!);
		} else if (e.ctrlKey && e.key === " ") {
			selectedCellRef.current?.scrollIntoView();
		}
	}, "keydown");

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
			await forceSave();
			await retrieveSelectedFileCells();
		}
	};

	const executeRequest = useCallback(
		async <T,>(cb: () => Promise<T>): Promise<T | null> => {
			try {
				return await cb();
			} catch (e) {
				console.error(e);
				onError(errorToString(e));
			}
			return null;
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
			const fetchedRepetitions = await getFileRepetitions(selectedFileId);
			setRepetitions(fetchedRepetitions);
			updatedCells.current = fetchedCells;
			return fetchedCells;
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
			await retrieveSelectedFileCells();
			const fetchedRepetitions = await getFileRepetitions(selectedFileId);
			setRepetitions(fetchedRepetitions);
		});
	}, [
		executeRequest,
		retrieveRepetitionCounts,
		retrieveSelectedFileCells,
		selectedFileId,
	]);

	const forceSave = useCallback(async () => {
		if (autoSaveTimeoutId.current !== null) {
			clearTimeout(autoSaveTimeoutId.current);
			autoSaveTimeoutId.current = null;
		}
		await saveChanges();
	}, [saveChanges]);

	useEffect(() => {
		const intervalId = setInterval(
			retrieveRepetitionCounts,
			oneMinuteInMilliseconds,
		);
		return () => clearInterval(intervalId);
	}, [retrieveRepetitionCounts]);

	const handleUpdate = (content: string, id: number) => {
		changedCellsIds.current.add(id);
		const newCells = [...updatedCells.current];
		newCells.find(c => c.id === id)!.content = content;
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
		const cellId = await executeRequest(async () => await createCell(cell));
		await forceSave();
		await retrieveSelectedFileCells();
		if (cellId) selectCell(cellId);
		await retrieveRepetitionCounts();
	};

	const handleCellDeleteConfirm = async () => {
		changedCellsIds.current.delete(selectedCellId!);
		const cellIndex = cells.findIndex(c => c.id === selectedCellId);
		await executeRequest(async () => await deleteCell(selectedCellId!));
		await retrieveRepetitionCounts();
		await forceSave();
		await retrieveSelectedFileCells();
		if (cellIndex > 0) {
			selectCell(cellIndex > 0 ? cells[cellIndex - 1].id! : null);
		} else if (cellIndex === 0 && cells.length > 1) {
			selectCell(cells[1].id!);
		} else {
			selectCell(null);
		}
	};

	const selectCell = useCallback(
		(id: number | null) => {
			if (selectedCellId !== id) {
				setSelectedCellId(id);
			}
		},
		[selectedCellId],
	);

	useEffect(() => {
		void (async () => {
			await forceSave();
			await retrieveRepetitionCounts();
			const cells = await retrieveSelectedFileCells();
			if (cells && cells.length > 0) {
				if (editCellId !== null && cells.some(c => c.id === editCellId))
					selectCell(editCellId);
				else selectCell(cells[0].id!);
			}
			setSearchText("");
		})();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFileId]);

	const handleDragOverAddCellContainer = (e: React.DragEvent) => {
		const dragCellId = Number(e.dataTransfer.getData(CELL_ID_DRAG_FORMAT));
		if (dragCellId === null) {
			return;
		}
		e.preventDefault();
		setIsDragOverAddCellContainer(true);
	};

	const handleDrop = async (e: React.DragEvent, index: number) => {
		const dragCellId = Number(e.dataTransfer.getData(CELL_ID_DRAG_FORMAT));
		if (dragCellId === null) return;
		const draggedCellIndex = cells.findIndex(c => c.id === dragCellId);
		if (index === draggedCellIndex) return;
		await executeRequest(async () => await moveCell(dragCellId, index));
		await forceSave();
		await retrieveSelectedFileCells();
		setIsDragOverAddCellContainer(false);
	};

	const startStudy = async () => {
		await forceSave();
		onStudyStart();
	};

	return (
		<div className={styles.container} key={selectedFileId}>
			<TitleBar
				repetitionCounts={repetitionCounts}
				onStudyButtonClick={() => void startStudy()}
				searchText={searchText}
				onSearchTextChange={setSearchText}
				searchInputRef={searchInputRef}
			/>

			<div
				className={styles.outerEditorContainer}
				ref={outerEditorContainerRef}>
				<div className={`${styles.editorContainer}`}>
					{cells.length === 0 && <p>This file is empty</p>}

					{cells
						.filter(c =>
							c.searchableContent.includes(
								searchText.toLowerCase(),
							),
						)
						.map((cell, i) => (
							<RenderIfVisible
								key={cell.id}
								defaultHeight={200}
								stayRendered={selectedCellId === cell.id}
								root={outerEditorContainerRef.current}>
								<CellBlock
									key={cell.id}
									ref={
										cell.id === selectedCellId
											? selectedCellRef
											: null
									}
									cell={cell}
									onSelect={selectCell}
									isSelected={selectedCellId === cell.id}
									onClick={() => selectCell(cell.id!)}
									showFocusTools={!searchText}
									autoFocusEditor={
										document.activeElement !=
											searchInputRef.current &&
										selectedCellId === cell.id
									}
									repetitions={repetitions.filter(
										r => r.cellId === cell.id,
									)}
									onError={onError}
									onDrop={e => void handleDrop(e, i)}
									onUpdate={content =>
										handleUpdate(content, cell.id!)
									}
									onDelete={() =>
										void handleCellDeleteConfirm()
									}
									onInsertNewCell={cellType =>
										void insertNewCell(cellType, i + 1)
									}
									onResetRepetitions={() =>
										void retrieveRepetitionCounts()
									}
								/>
							</RenderIfVisible>
						))}

					<AddCellContainer
						isDragOver={isDragOverAddCellContainer}
						onDragOver={handleDragOverAddCellContainer}
						onDrop={e => void handleDrop(e, cells.length)}
						onDragLeave={() => setIsDragOverAddCellContainer(false)}
						onAddNewCell={cellType =>
							void insertNewCell(cellType, cells.length)
						}
					/>
				</div>
			</div>
		</div>
	);
}

export default Editor;
