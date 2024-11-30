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
import { getCellsForFiles } from "../../services/cellService";
import { getRepetitionsForFiles } from "../../services/repetitionService";

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
			if (e instanceof Error) onError(e.message);
			else onError(e as string);
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
