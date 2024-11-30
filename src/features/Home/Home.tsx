import { useEffect } from "react";
import useAppDispatch from "../../hooks/useAppDispatch";
import useAppSelector from "../../hooks/useAppSelector";
import { fetchFiles } from "../../store/actions/fileSystemActions";
import { selectRootFolder } from "../../store/selectors/fileSystemSelectors";
import ReviewTree from "./ReviewTree";
import styles from "./styles.module.css";
import ParsedFile from "../../types/parsedFile";
import ParsedFolder from "../../types/parsedFolder";
import Repetition from "../../types/backend/repetition";
import Cell from "../../types/backend/cell";

interface Props {
	onStudyClick: (fileCells: Cell[], fileRepetitions: Repetition[]) => void;
}

function Home({ onStudyClick }: Props) {
	const dispatch = useAppDispatch();
	const rootFolder = useAppSelector(selectRootFolder);

	useEffect(() => {
		void dispatch(fetchFiles());
	}, [dispatch]);

	const handleFileClick = (file: ParsedFile) => {
        // TODO: end rust to also return cells + repetitions
    };

	const handleFolderClick = (folder: ParsedFolder) => {
        // TODO: end rust to also return cells + repetitions
    };

	// TODO: implement on click
	// TODO: show something else if no files/folder are created
	return (
		<div className={styles.home}>
			<div className={styles.box}>
				<div className={styles.row + " " + styles.header}>
					<p>Files</p>
					<div className={styles.columns}>
						<p>New</p>
						<p>Learn</p>
						<p>Review</p>
					</div>
				</div>
				{rootFolder && (
					<ReviewTree folder={rootFolder} indentationLevel={-1} />
				)}
			</div>
		</div>
	);
}

export default Home;
