import { useEffect, useState } from "react";
import useAppDispatch from "../../hooks/useAppDispatch";
import useAppSelector from "../../hooks/useAppSelector";
import { fetchFiles } from "../../store/actions/fileSystemActions";
import { selectRootFolder } from "../../store/selectors/fileSystemSelectors";
import ReviewTree from "./ReviewTree";
import styles from "./styles.module.css";
import ParsedFolder from "../../type/parsedFolder";
import ReviwerHeatmap from "./ReviewHeatmap";
import { getTodaysReviewStatistics } from "../../api/reviewApi";
import ReviewStatistics from "../../type/backend/dto/reviewStatistics";
import errorToString from "../../util/errorToString";

interface Props {
	onStudyClick: (fileIds: number[]) => void;
	onError: (message: string) => void;
}

function Home({ onStudyClick, onError }: Props) {
	const [reviewStatistics, setReviewStatistics] =
		useState<ReviewStatistics | null>(null);
	const dispatch = useAppDispatch();
	const rootFolder = useAppSelector(selectRootFolder);

	useEffect(() => {
		void dispatch(fetchFiles());
	}, [dispatch]);

	useEffect(() => {
		void (async () => {
            try {
                setReviewStatistics(await getTodaysReviewStatistics());
            } catch (e) {
                console.error(e);
                onError(errorToString(e));
            }
		})();
	}, [onError]);

	const handleFolderClick = (folder: ParsedFolder) => {
		const fileIds = [];
		const folderQueue = [folder];
		while (folderQueue.length > 0) {
			const currentFolder = folderQueue.pop()!;
			for (const file of currentFolder.files) {
				fileIds.push(file.id);
			}
			folderQueue.push(...currentFolder.subFolders);
		}
		onStudyClick(fileIds);
	};

    // TODO: format time statistics better
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
						onFileClick={file => onStudyClick([file.id])}
						onFolderClick={handleFolderClick}
					/>
				)}
			</div>

			{reviewStatistics && (
				<p className={styles.reviewsOverview}>
					Studied {reviewStatistics.numberOfReviews} cards in{" "}
					{reviewStatistics.totalTime} seconds today (
					{(
						reviewStatistics.totalTime /
						reviewStatistics.numberOfReviews
					).toFixed(1)}{" "}
					s/card){" "}
				</p>
			)}

			<ReviwerHeatmap />
		</div>
	);
}

export default Home;
