import Editor from "../editor/Editor";
import styles from "./styles.module.css";
import { useCallback, useEffect, useState } from "react";
import ErrorBox from "../../ui/errorBox/ErrorBox";
import Reviewer from "../reviewer/Reviewer";
import Home from "../home/Home";
import useAppDispatch from "../../hooks/useAppDispatch";
import useAppSelector from "../../hooks/useAppSelector";
import { selectRootFolder, selectSelectedFileId } from "../../store/selectors/fileSystemSelectors";
import { fetchFiles } from "../../store/actions/fileSystemActions";
import SideBar from "../sideBar/SideBar";
import ICell from "../../entities/cell";
import { invoke } from "@tauri-apps/api/core";

// TODO: add shortcut to start study, shortcut to insert new cell
function App() {
    const [isReviewing, setIsReviewing] = useState(false);;
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [cells, setCells] = useState<ICell[]>([]);
    const rootFolder = useAppSelector(selectRootFolder);
    const dispatch = useAppDispatch();
    const selectedFileId = useAppSelector(selectSelectedFileId);


    const fetchFileCells = useCallback(async () => {
        try {
            const fetchedCells: ICell[] = await invoke("get_cells", {
                fileId: selectedFileId
            });
            setCells(fetchedCells);
        } catch (e) {
            console.error(e);
            if (e instanceof Error) setErrorMessage(e.message);
            else setErrorMessage(e as string);
        }
    }, [setCells, selectedFileId]);

    useEffect(() => {
        void fetchFileCells();
    }, [fetchFileCells]);

    useEffect(() => {
        void dispatch(fetchFiles());
    }, [dispatch])

    const handleEndReview = () => {
        setIsReviewing(false);
    };

    return (
        <div className={`${styles.workspace}`}>
            {errorMessage && 
                <div className={styles.errorDialog}>
                    <ErrorBox
                        message={errorMessage}
                        onClose={() => setErrorMessage(null)} />
                </div>}

            <SideBar />

            <div className={`${styles.workarea}`}>

                {!selectedFileId &&
                    <Home rootFolder={rootFolder} />}

                {selectedFileId && !isReviewing &&
                    <Editor
                        cells={cells}
                        onError={setErrorMessage}
                        onCellsUpdate={setCells}
                        fetchFileCells={fetchFileCells} />}

                {selectedFileId && isReviewing &&
                    <Reviewer
                        cells={cells}
                        onEditButtonClick={() => setIsReviewing(false)}
                        onReviewEnd={() => void handleEndReview()}
                        onError={setErrorMessage} />}
            </div>
        </div>
    );
}

export default App;
