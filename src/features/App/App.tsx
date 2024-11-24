import Editor from "../Editor/Editor";
import styles from "./styles.module.css";
import { useEffect, useState } from "react";
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
import { retrieveSelectedFileCells } from "../../store/actions/selectedFileCellsActions";

function App() {
	const [isReviewing, setIsReviewing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const rootFolder = useAppSelector(selectRootFolder);
	const selectedFileId = useAppSelector(selectSelectedFileId);
	const dispatch = useAppDispatch();

	useEffect(() => {
		void dispatch(fetchFiles());
	}, [dispatch]);

	useEffect(() => {
        void dispatch(retrieveSelectedFileCells());
		setIsReviewing(false);
	}, [dispatch, selectedFileId]);

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
						onError={setErrorMessage}
						onStudyButtonClick={() => setIsReviewing(true)}
					/>
				)}

				{selectedFileId && isReviewing && (
					<Reviewer
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
