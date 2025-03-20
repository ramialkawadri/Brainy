import { useEffect, useState } from "react";
import useAppDispatch from "../../hooks/useAppDispatch";
import useAppSelector from "../../hooks/useAppSelector";
import { fetchFiles } from "../../store/actions/fileSystemActions";
import { selectRootFolder } from "../../store/selectors/fileSystemSelectors";
import ReviewTree from "./ReviewTree";
import styles from "./styles.module.css";
import ParsedFolder from "../../type/parsedFolder";
import ReviewHeatmap from "./ReviewHeatmap";
import HomeStatistics from "../../type/backend/dto/homeStatistics";
import errorToString from "../../util/errorToString";
import secondsToLongString from "../../util/secondsToLongString";
import { getHomeStatistics } from "../../api/reviewApi";

interface Props {
	onStudyClick: (fileIds: number[]) => void;
	onError: (message: string) => void;
}

function Home({ onStudyClick, onError }: Props) {
	const [homeStatistics, setHomeStatistics] = useState<HomeStatistics | null>(
		null,
	);
	const dispatch = useAppDispatch();
	const rootFolder = useAppSelector(selectRootFolder);

	useEffect(() => {
		void dispatch(fetchFiles());
	}, [dispatch]);

	useEffect(() => {
		void (async () => {
			try {
				setHomeStatistics(await getHomeStatistics());
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

	const secondsPerCard =
		homeStatistics && homeStatistics.numberOfReviews > 0
			? homeStatistics.totalTime / homeStatistics.numberOfReviews
			: 0;

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

			{homeStatistics && (
				<>
					<p className={styles.reviewsOverview}>
						Studied {homeStatistics.numberOfReviews} cards in
						{" " +
							secondsToLongString(homeStatistics.totalTime)}{" "}
						today ({secondsPerCard.toFixed(1) + " "}
						s/card)
					</p>
					<ReviewHeatmap homeStatistics={homeStatistics} />
				</>
			)}
		</div>
	);
}

export default Home;
