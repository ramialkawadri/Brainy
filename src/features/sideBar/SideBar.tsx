import styles from "./styles.module.css";
import ErrorBox from "../../ui/errorBox/ErrorBox";
import FileTree from "../fileTree/FileTree";
import useAppSelector from "../../hooks/useAppSelector";
import useAppDispatch from "../../hooks/useAppDispatch";
import { selectError, selectRootFolder } from "../../store/selectors/fileSystemSelectors";
import { setErrorMessage, setSearchText } from "../../store/reducers/fileSystemReducers";

// TODO: expand/hide sidebar
// TODO: Add Home button, search button (in all cells), add settings button
// TODO: fix search
function SideBar() {
    const rootFolder = useAppSelector(selectRootFolder);
    const errorMessage = useAppSelector(selectError);
    const dispatch = useAppDispatch();

    // TODO: add ability to create from nothing

    return (
        <div className={`${styles.sideBar}`}>
            <div>
                <div className={`${styles.searchBar}`}>
                    <input type="text" placeholder="Search"
                        onChange={e => dispatch(setSearchText(e.target.value))}
                        className={`${styles.sideBarSearch}`} />
                </div>

                {errorMessage && <ErrorBox message={errorMessage}
                    onClose={() => dispatch(setErrorMessage(""))} /> }

                <FileTree folder={rootFolder} />
            </div>
        </div>
    );
}

export default SideBar;
