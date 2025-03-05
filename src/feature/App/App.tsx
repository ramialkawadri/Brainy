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
import { getFileCellsOrderedByIndex } from "../../api/cellApi";
import Cell from "../../type/backend/entity/cell";
import Repetition from "../../type/backend/entity/repetition";
import { getFileRepetitions } from "../../api/repetitionApi";
import { setSelectedFileId } from "../../store/reducers/fileSystemReducers";
import SettingsPopup from "../SettingsPopup/SettingsPopup";
import { getSettings } from "../../api/settingsApi";
import errorToString from "../../util/errorToString";
import applySettings from "../../util/applySettings";
import useGlobalKey from "../../hooks/useGlobalKey";

const SMALL_SCREEN_MAX_WIDTH = 600;

function App() {
	const [isStudying, setIsStudying] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
	const selectedFileId = useAppSelector(selectSelectedFileId);
	const cells = useRef<Cell[]>([]);
	const cellRepetitions = useRef<Repetition[]>([]);
	const editCellId = useRef<number | null>(null);
	const dispatch = useAppDispatch();
	const isSmallScreen = useRef(window.innerWidth <= SMALL_SCREEN_MAX_WIDTH);

	useEffect(() => {
		window.addEventListener("resize", () => {
			isSmallScreen.current = window.innerWidth <= SMALL_SCREEN_MAX_WIDTH;
		});
	});

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
			setErrorMessage(errorToString(e));
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
		void (async () => {
			const settings = await getSettings();
			applySettings(settings);
		})();

		document.addEventListener("contextmenu", e => {
			if (!import.meta.env.DEV) e.preventDefault();
		});

		document.addEventListener("keydown", e => {
			if ((e.ctrlKey && e.key.toLowerCase() === "r") || e.code === "F5") {
				e.preventDefault();
			}
		});
	}, [dispatch]);

	useEffect(() => {
		setIsStudying(false);

		if (isSmallScreen.current) setIsSidebarExpanded(false);
	}, [dispatch, selectedFileId]);

	useGlobalKey(e => {
		if (e.ctrlKey && e.key.toLowerCase() === "p") {
			e.preventDefault();
			setShowSettings(true);
		} else if (e.ctrlKey && e.key.toLowerCase() === "h") {
			e.preventDefault();
			setIsStudying(false);
			dispatch(setSelectedFileId(null));
		} else if (e.code === "F5") {
			e.preventDefault();
		}
	}, "keydown");

	const handleEditButtonClick = (fileId: number, cellId: number) => {
		editCellId.current = cellId;
		setIsStudying(false);
		dispatch(setSelectedFileId(fileId));
	};

	const handleHomeClick = () => {
		setIsStudying(false);
		dispatch(setSelectedFileId(null));

		if (isSmallScreen.current) setIsSidebarExpanded(false);
	};

	// TODO: move sidebar state into global state, use react router to change selected file
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
				isExpanded={isSidebarExpanded}
				setIsExpanded={setIsSidebarExpanded}
				onFileClick={() => setIsStudying(false)}
				onRootClick={() => setIsStudying(false)}
				onHomeClick={handleHomeClick}
				onSettingsClick={() => setShowSettings(true)}
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
						editCellId={editCellId.current}
						onError={setErrorMessage}
						onStudyStart={() => void handleEditorStudyClick()}
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

			{showSettings && (
				<SettingsPopup
					onClose={() => setShowSettings(false)}
					onError={setErrorMessage}
					onUpdate={() => setIsStudying(false)}
				/>
			)}
		</div>
	);
}

export default App;
