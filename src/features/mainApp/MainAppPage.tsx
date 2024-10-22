import Editor from "../editor/Editor";
import SideBar from "./SideBar";
import styles from "./styles.module.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { autoSaveDelay } from "../../constants";
import useGlobalKey from "../../hooks/useGlobalKey";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";
import { CellInfoDto, CellRepetitionCountsDto, CellRepetitionDto } from "../../services/backendApi";
import Spinner from "../../ui/Spinner/Spinner";
import Reviewer from "../reviewer/Reviewer";
import Home from "../home/Home";
import useBeforeUnload from "../../hooks/useBeforeUnload";
import useAppDispatch from "../../hooks/useAppDispatch";
import { fetchFiles, } from "../fileSystem/actions.ts";
import useAppSelector from "../../hooks/useAppSelector";
import { useSelector } from "react-redux";
import { selectFileSystemIsLoading, selectFileSystemRootFolder } from "../fileSystem/selectors.ts";

// TODO: add shortcut to start study, shortcut to insert new cell
function MainAppPage() {
    const [cells, setCells] = useState<CellInfoDto[]>([]);
    const [cellRepetitions, setCellRepetitions] = useState<CellRepetitionDto[]>([]);
    const [repetitionCounts, setRepetitionCounts] =
        useState<CellRepetitionCountsDto>({});
    const [isExistingFile, setIsExistingFile] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isReviewing, setIsReviewing] = useState(false);;
    const isLoading = useSelector(selectFileSystemIsLoading);
    // TODO:
    const errorMessage = "";
    const rootFolder = useAppSelector(selectFileSystemRootFolder);
    const saveTimeoutId = useRef(-1);
    const dispatch = useAppDispatch();
    useGlobalKey(handleKeyDown, "keydown");
    // TODO:
    // const currentFileName = getFileName(
    //     searchParams.get(selectedFileQueryStringParameter) ?? "");
    const currentFileName = "";

    const updateRepetitionCounts = useCallback(async () => {
        if (!currentFileName) {
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
    }, [currentFileName]);

    const stopAutoSave = useCallback(() => {
        clearTimeout(saveTimeoutId.current);
        saveTimeoutId.current = -1;
    }, [saveTimeoutId]);

    const saveFile = useCallback(async () => {
        if (saveTimeoutId.current === -1) {
            // The save timeout is used to know if a file has changed or not.
            return;
        }
        setIsSaving(true);
        try {
            // TODO:
            // stopAutoSave();
            // const response = await api(backendApi.updateFile(cells, {
            //     filePath: searchParams.get(selectedFileQueryStringParameter)!,
            // }));
            // if (response.status !== 200) {
            //     const problemDetails =
            //         getErrorFromAxiosResponse<ProblemDetails>(response);
            //     setErrorMessage(problemDetails.detail ?? "");
            // }
            // await updateRepetitionCounts();
        } catch (e) {
            // setErrorMessage("An error has happened.");
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    }, [setIsSaving, saveTimeoutId]);

    const handleBeforeUnload = useCallback(async (e: BeforeUnloadEvent) => {
        if (saveTimeoutId.current !== -1 || isSaving) {
            e.preventDefault();
            if (!isSaving) {
                await saveFile();
            }
        }
    }, [isSaving, saveFile]);

    useBeforeUnload((e) => void handleBeforeUnload(e));

    useEffect(() => {
        const updateFileContent = async () => {
            if (!currentFileName) {
                return;
            }

            // setIsLoading(true);
            try {
                // TODO:
                // const response = await api(backendApi.getFileContent({
                //     filePath: searchParams.get(selectedFileQueryStringParameter)!,
                // }));
                // if (response.status === 200) {
                //     setCells(response.data);
                //     setIsExistingFile(true);
                // } else {
                //     if (response.status === 404) {
                //         setIsExistingFile(false);
                //     }
                //     const problemDetails =
                //         getErrorFromAxiosResponse<ProblemDetails>(response);
                //     setErrorMessage(problemDetails.detail ?? "");
                // }
            } catch (e) {
                setCells([]);
                // setErrorMessage("An error has happened while fetching file content.");
                console.error(e);
            } finally {
                // setIsLoading(false);
            }
        };

        // setErrorMessage("");
        void updateFileContent();
        void updateRepetitionCounts();
    }, [currentFileName, updateRepetitionCounts]);

    useEffect(() => {
        void dispatch(fetchFiles());
    }, [dispatch])

    const startAutoSaveTimer = useCallback(() => {
        if (saveTimeoutId.current !== -1) {
            stopAutoSave();
        }
        saveTimeoutId.current = setTimeout(saveFile, autoSaveDelay);
    }, [stopAutoSave, saveTimeoutId, saveFile]);

    const handleDeleteCell = (index: number) => {
        cells.splice(index, 1);
        setCells(cells);
        startAutoSaveTimer();
    };

    const handleCellsUpdate = useCallback((newCells: CellInfoDto[]) => {
        setCells(newCells);
        startAutoSaveTimer();
    }, [setCells, startAutoSaveTimer]);

    function handleKeyDown(e: KeyboardEvent) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
            e.preventDefault();
            void saveFile();
            return false;
        }
        return true;
    }

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
                        onClose={() => {/*TODO:*/}} />
                </div>}

            <SideBar />

            <div className={`${styles.workarea}`}>
                {isLoading &&
                    <div className="center">
                        <Spinner text="Loading" />
                    </div>}

                {!isLoading && !currentFileName &&
                    <Home rootFolder={rootFolder} />}

                {currentFileName && isExistingFile && !isLoading && !isReviewing &&
                    <Editor cells={cells} title={currentFileName}
                        onUpdate={handleCellsUpdate}
                        onSave={saveFile}
                        onDelete={handleDeleteCell}
                        isSaving={isSaving}
                        repetitionCounts={repetitionCounts}
                        onStudyButtonClick={() => void handleStudyButtonClick()} />}

                {/* TODO: filePath={searchParams.get(selectedFileQueryStringParameter)!*/}
                {currentFileName && isExistingFile && !isLoading && isReviewing &&
                    <Reviewer
                        cellRepetitions={cellRepetitions}
                        cells={cells}
                        filePath=""
                        onEditButtonClick={() => setIsReviewing(false)}
                        onReviewEnd={() => void handleEndReview()}
                        onError={() => {/*TODO:*/}} />}
            </div>
        </div>
    );
}

export default MainAppPage;
