import { useMemo } from "react";
import styles from "./styles.module.css";
import { FileInfoDto } from "../../services/backendApi";
import parseListUserFilesResponse from "../../utils/parseListUserFilesResponse";
import Tree from "./Tree";

interface IProps {
    userFiles: FileInfoDto[],
}

function Home({ userFiles }: IProps) {
    const rootFolder = useMemo(
        () => parseListUserFilesResponse(userFiles), [userFiles]);

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
