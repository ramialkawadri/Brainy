import Editor from "../Editor/Editor";
import styles from "./styles.module.css";
import { useEffect, useRef, useState } from "react";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";
import Reviewer from "../Reviewer/Reviewer";
import Home from "../Home/Home";
import useAppDispatch from "../../hooks/useAppDispatch";
import useAppSelector from "../../hooks/useAppSelector";
import { selectSelectedFileId } from "../../store/selectors/fileSystemSelectors";
import { fetchFiles } from "../../store/actions/fileSystemActions";
import SideBar from "../SideBar/SideBar";
import { getFileCellsOrderedByIndex } from "../../services/cellService";
import Cell from "../../types/backend/cell";
import Repetition from "../../types/backend/repetition";
import { getFileRepetitions } from "../../services/repetitionService";
import { setSelectedFileId } from "../../store/reducers/fileSystemReducers";

function App() {
	const [isStudying, setIsStudying] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const selectedFileId = useAppSelector(selectSelectedFileId);
	const cells = useRef<Cell[]>([]);
	const cellRepetitions = useRef<Repetition[]>([]);
	const dispatch = useAppDispatch();

	const handleEditorStudyClick = async () => {
		try {
			const fetchedCells = await getFileCellsOrderedByIndex(
				selectedFileId!,
			);
			cells.current = fetchedCells;
			const repetitions = await getFileRepetitions(selectedFileId!);
			cellRepetitions.current = repetitions;
			setIsStudying(true);
		} catch (e) {
			console.error(e);
			if (e instanceof Error) setErrorMessage(e.message);
			else setErrorMessage(e as string);
		}
	};

	const handleHomeStudyClick = (
		fileCells: Cell[],
		fileRepetitions: Repetition[],
	) => {
		cells.current = fileCells;
		cellRepetitions.current = fileRepetitions;
		setIsStudying(true);
	};

	useEffect(() => {
		void dispatch(fetchFiles());
	}, [dispatch]);

	useEffect(() => {
		setIsStudying(false);
	}, [dispatch, selectedFileId]);

	const handleEditButtonClick = (fileId: number) => {
		setIsStudying(false);
		dispatch(setSelectedFileId(fileId));
	};

    const handleHomeClick = () => {
		setIsStudying(false);
		dispatch(setSelectedFileId(null));
    };

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

			<SideBar
				onFileClick={() => setIsStudying(false)}
				onRootClick={() => setIsStudying(false)}
                onHomeClick={handleHomeClick}
			/>

			<div className={`${styles.workarea}`}>
				{!isStudying && !selectedFileId && (
					<Home
						onStudyClick={handleHomeStudyClick}
						onError={setErrorMessage}
					/>
				)}

				{!isStudying && selectedFileId && (
					<Editor
						onError={setErrorMessage}
						onStudyButtonClick={() => void handleEditorStudyClick()}
					/>
				)}

				{isStudying && (
					<Reviewer
						onEditButtonClick={handleEditButtonClick}
						onReviewEnd={() => setIsStudying(false)}
						onError={setErrorMessage}
						cells={cells.current}
						cellRepetitions={cellRepetitions.current}
					/>
				)}
			</div>
		</div>
	);
}

export default App;
