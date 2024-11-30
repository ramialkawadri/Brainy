import { useEffect } from "react";
import useAppDispatch from "../../hooks/useAppDispatch";
import useAppSelector from "../../hooks/useAppSelector";
import { fetchFiles } from "../../store/actions/fileSystemActions";
import { selectRootFolder } from "../../store/selectors/fileSystemSelectors";
import ReviewTree from "./ReviewTree";
import styles from "./styles.module.css";

function Home() {
	const dispatch = useAppDispatch();
	const rootFolder = useAppSelector(selectRootFolder);

    useEffect(() => {
        void dispatch(fetchFiles());
    }, [dispatch]);

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
				<ReviewTree folder={rootFolder} indentationLevel={-1} />
			)}
		</div>
	);
}

export default Home;
