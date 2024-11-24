import Folder from "../../types/folder";
import styles from "./styles.module.css";
import Tree from "./Tree";

interface Props {
	rootFolder: Folder;
}

// TODO: rename from Home to something else!
function Home({ rootFolder }: Props) {
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
			{rootFolder && <Tree folder={rootFolder} name="" depthLevel={-1} />}
		</div>
	);
}

export default Home;
