import styles from "./styles.module.css";
import Tree from "./Tree";
import IFolder from "../fileSystem/Folder";

interface IProps {
    rootFolder: IFolder,
}

function Home({ rootFolder }: IProps) {

    // TODO: spinner on loading
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
