import { useCallback, useEffect, useRef, useState } from "react";
import TitleBar from "./TitleBar";
import styles from "./styles.module.css";
import Cell from "../../type/backend/entity/cell";
import FileRepetitionCounts from "../../type/backend/model/fileRepetitionCounts";
import { getFileCellsOrderedByIndex } from "../../api/cellApi";
import {
	getFileRepetitions,
	getStudyRepetitionCounts,
} from "../../api/repetitionApi";
import errorToString from "../../util/errorToString";
import useGlobalKey from "../../hooks/useGlobalKey";
import { useSearchParams } from "react-router";
import { fileIdQueryParameter } from "../../constants";
import Repetition from "../../type/backend/entity/repetition";
import EditableCells from "../EditableCells/EditableCells";

const oneMinuteInMilliseconds = 60 * 1000;

interface Props {
	editCellId: number | null;
	onError: (error: string) => void;
	onStudyStart: () => void;
}

function Editor({ editCellId, onError, onStudyStart }: Props) {
	const [repetitions, setRepetitions] = useState<Repetition[]>([]);
	const [searchText, setSearchText] = useState("");
	const [repetitionCounts, setRepetitionCounts] =
		useState<FileRepetitionCounts>({
			new: 0,
			learning: 0,
			relearning: 0,
			review: 0,
		});
	const [cells, setCells] = useState<Cell[]>([]);
	const [searchParams] = useSearchParams();
	const searchInputRef = useRef<HTMLInputElement>(null);
	const selectedFileId = Number(searchParams.get(fileIdQueryParameter));

	useGlobalKey(e => {
		if (e.code === "F5") {
			void startStudy();
		}
	}, "keydown");

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
			return fetchedCells;
		});
	}, [executeRequest, selectedFileId]);

	useEffect(() => {
		const intervalId = setInterval(
			retrieveRepetitionCounts,
			oneMinuteInMilliseconds,
		);
		return () => clearInterval(intervalId);
	}, [retrieveRepetitionCounts]);

	useEffect(() => {
		void (async () => {
			await retrieveRepetitionCounts();
			await retrieveSelectedFileCells();
			setSearchText("");
		})();

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedFileId]);

	const startStudy = () => {
		onStudyStart();
	};

	const handleCellsUpdate = useCallback(async () => {
		await retrieveSelectedFileCells();
		await retrieveRepetitionCounts();
		const fetchedRepetitions = await getFileRepetitions(selectedFileId);
		setRepetitions(fetchedRepetitions);
	}, [retrieveRepetitionCounts, retrieveSelectedFileCells, selectedFileId]);

	return (
		<div className={styles.container} key={selectedFileId}>
			<TitleBar
				repetitionCounts={repetitionCounts}
				onStudyButtonClick={() => void startStudy()}
				searchText={searchText}
				onSearchTextChange={setSearchText}
				searchInputRef={searchInputRef}
			/>

			<EditableCells
				key={selectedFileId}
				cells={cells}
				searchText={searchText}
				repetitions={repetitions}
				onError={onError}
				editCellId={editCellId}
				fileId={selectedFileId}
				onCellsUpdate={handleCellsUpdate}
				autoFocusEditor={
					document.activeElement !== searchInputRef.current
				}
			/>
		</div>
	);
}

export default Editor;
