import useAppSelector from "../../hooks/useAppSelector";
import { selectRootFolder } from "../../store/selectors/fileSystemSelectors";
import ReviewTree from "./ReviewTree";
import styles from "./styles.module.css";

function Home() {
	const rootFolder = useAppSelector(selectRootFolder);

    // TODO: implement on click
	// TODO: show something else if no files/folder are created
	return (
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
				<ReviewTree folder={rootFolder} name="" depthLevel={-1} />
			)}
		</div>
	);
}

export default Home;
