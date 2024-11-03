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

// TODO: add shortcut to start study, shortcut to insert new cell
function App() {
    const [cells, setCells] = useState<CellInfoDto[]>([]);
    const [cellRepetitions, setCellRepetitions] = useState<CellRepetitionDto[]>([]);
    const [repetitionCounts, setRepetitionCounts] = useState<CellRepetitionCountsDto>({});
    const [isReviewing, setIsReviewing] = useState(false);;
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const rootFolder = useAppSelector(selectRootFolder);
    const dispatch = useAppDispatch();
    const selectedFileId = useAppSelector(selectSelectedFileId);

    const updateRepetitionCounts = useCallback(async () => {
        if (!selectedFileId) {
            return;
        }

        try {
            // TODO:
            // const response = await api(backendApi.getFileCellRepetitionsCounts({
            //     filePath: searchParams.get(selectedFileQueryStringParameter)!,
            // }));
            // if (response.status === 200) {
            //     setRepetitionCounts(response.data);
            // } else {
            //     const problemDetails =
            //         getErrorFromAxiosResponse<ProblemDetails>(response);
            //     setErrorMessage(problemDetails.detail ?? "");
            // }
        } catch (e) {
            // setErrorMessage("An error has happened while getting the cell repetition counts.");
            console.error(e);
        }
    }, [selectedFileId]);

    useEffect(() => {
        void updateRepetitionCounts();
    }, [selectedFileId, updateRepetitionCounts]);

    useEffect(() => {
        void dispatch(fetchFiles());
    }, [dispatch])

    const handleEndReview = async () => {
        setIsReviewing(false);
        await updateRepetitionCounts();
    };

    const handleStudyButtonClick = async () => {
        // TODO:
        // try {
        //     setIsLoading(true);
        //     await saveFile();
        //     setSearchParams({
        //         ...Object.fromEntries(searchParams.entries()),
        //     });
        //     const response = await api(backendApi.getFileCellRepetitions({
        //         filePath: searchParams.get(selectedFileQueryStringParameter)!,
        //     }));
        //
        //     if (response.status === 200) {
        //         setCellRepetitions(response.data);
        //         setIsReviewing(true);
        //     } else {
        //         const problemDetails =
        //             getErrorFromAxiosResponse<ProblemDetails>(response);
        //         setErrorMessage(problemDetails.detail ?? "");
        //     }
        // } catch (e) {
        //     setSearchParams(searchParams);
        //     setErrorMessage("An error has happened while preparing file to study.");
        //     console.error(e);
        // } finally {
        //     setIsLoading(false);
        // }
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
                    <Editor onError={setErrorMessage} />}

                {selectedFileId && isReviewing &&
                    <Reviewer
                        cellRepetitions={cellRepetitions}
                        cells={cells}
                        filePath=""
                        onEditButtonClick={() => setIsReviewing(false)}
                        onReviewEnd={() => void handleEndReview()}
                        onError={setErrorMessage} />}
            </div>
        </div>
    );
}

export default App;
