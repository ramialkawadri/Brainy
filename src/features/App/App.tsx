import Editor from "../Editor/Editor";
import styles from "./styles.module.css";
import { useCallback, useEffect, useState } from "react";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";
import Reviewer from "../Reviewer/Reviewer";
import Home from "../Home/Home";
import useAppDispatch from "../../hooks/useAppDispatch";
import useAppSelector from "../../hooks/useAppSelector";
import {
	selectRootFolder,
	selectSelectedFileId,
} from "../../store/selectors/fileSystemSelectors";
import { fetchFiles } from "../../store/actions/fileSystemActions";
import SideBar from "../SideBar/SideBar";
import Cell from "../../entities/cell";
import { invoke } from "@tauri-apps/api/core";

function App() {
	const [isReviewing, setIsReviewing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [cells, setCells] = useState<Cell[]>([]);
	const rootFolder = useAppSelector(selectRootFolder);
	const selectedFileId = useAppSelector(selectSelectedFileId);
	const dispatch = useAppDispatch();

	const fetchFileCells = useCallback(async () => {
		try {
			const fetchedCells: Cell[] = await invoke("get_file_cells_ordered_by_index", {
				fileId: selectedFileId,
			});
			setCells(fetchedCells);
		} catch (e) {
			console.error(e);
			if (e instanceof Error) setErrorMessage(e.message);
			else setErrorMessage(e as string);
		}
	}, [selectedFileId]);

	useEffect(() => {
		void fetchFileCells();
		void dispatch(fetchFiles());
	}, [fetchFileCells, dispatch]);

    useEffect(() => {
        setIsReviewing(false);
    }, [selectedFileId]);

	return (
		<div className={`${styles.workspace}`}>
			{errorMessage && (
				<div className={styles.errorDialog}>
					<ErrorBox
						message={errorMessage}
						onClose={() => setErrorMessage(null)}
					/>
				</div>
			)}

			<SideBar />

			<div className={`${styles.workarea}`}>
				{!selectedFileId && <Home rootFolder={rootFolder} />}

				{selectedFileId && !isReviewing && (
					<Editor
						cells={cells}
						onError={setErrorMessage}
						onCellsUpdate={setCells}
						fetchFileCells={fetchFileCells}
						onStudyButtonClick={() => setIsReviewing(true)}
					/>
				)}

				{selectedFileId && isReviewing && (
					<Reviewer
						cells={cells}
						onEditButtonClick={() => setIsReviewing(false)}
						onReviewEnd={() => setIsReviewing(false)}
						onError={setErrorMessage}
					/>
				)}
			</div>
		</div>
	);
}

export default App;
