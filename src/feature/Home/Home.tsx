import { useEffect } from "react";
import useAppDispatch from "../../hooks/useAppDispatch";
import useAppSelector from "../../hooks/useAppSelector";
import { fetchFiles } from "../../store/actions/fileSystemActions";
import { selectRootFolder } from "../../store/selectors/fileSystemSelectors";
import ReviewTree from "./ReviewTree";
import styles from "./styles.module.css";
import ParsedFile from "../../type/parsedFile";
import ParsedFolder from "../../type/parsedFolder";
import Repetition from "../../type/backend/entity/repetition";
import Cell from "../../type/backend/entity/cell";
import { getCellsForFiles } from "../../api/cellApi";
import { getRepetitionsForFiles } from "../../api/repetitionApi";
import errorToString from "../../util/errorToString";

interface Props {
	onStudyClick: (fileCells: Cell[], fileRepetitions: Repetition[]) => void;
	onError: (message: string) => void;
}

function Home({ onStudyClick, onError }: Props) {
	const dispatch = useAppDispatch();
	const rootFolder = useAppSelector(selectRootFolder);

	useEffect(() => {
		void dispatch(fetchFiles());
	}, [dispatch]);

	const startStudyForFiles = async (fileIds: number[]) => {
		try {
			const cells = await getCellsForFiles(fileIds);
			if (cells.length == 0) return;
			const repetitions = await getRepetitionsForFiles(fileIds);
			onStudyClick(cells, repetitions);
		} catch (e) {
			console.error(e);
			onError(errorToString(e));
		}
	};

	const handleFileClick = async (file: ParsedFile) => {
		await startStudyForFiles([file.id]);
	};

	const handleFolderClick = async (folder: ParsedFolder) => {
		const fileIds = [];
		const folderQueue = [folder];
		while (folderQueue.length > 0) {
			const currentFolder = folderQueue.pop()!;
			for (const file of currentFolder.files) {
				fileIds.push(file.id);
			}
			folderQueue.push(...currentFolder.subFolders);
		}
		await startStudyForFiles(fileIds);
	};

	return (
		<div className={styles.home}>
			<div className={styles.box}>
				<div className={styles.row + " " + styles.header}>
                <div className={styles.buttons}>
                <span></span>
                <p>Files</p>
                </div>
					<div className={styles.columns}>
						<p>New</p>
						<p>Learn</p>
						<p>Review</p>
					</div>
				</div>
				{rootFolder &&
					rootFolder.files.length + rootFolder.subFolders.length ===
						0 && <p>Create a file to see it in the review tree.</p>}
				{rootFolder && (
					<ReviewTree
						folder={rootFolder}
						indentationLevel={-1}
						onFileClick={handleFileClick}
						onFolderClick={handleFolderClick}
					/>
				)}
			</div>
		</div>
	);
}

export default Home;
