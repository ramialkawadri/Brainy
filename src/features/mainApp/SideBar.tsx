import styles from "./styles.module.css";
import ErrorBox from "../../ui/errorBox/ErrorBox";
import FileTree from "../fileTree/FileTree";
import useAppSelector from "../../hooks/useAppSelector";
import { setErrorMessage, setSearchText } from "../fileSystem/fileSystemSlice";
import useAppDispatch from "../../hooks/useAppDispatch";
import { selectFileSystemError, selectFileSystemRootFolder } from "../fileSystem/selectors";

// TODO: expand/hide sidebar
function SideBar() {
    const rootFolder = useAppSelector(selectFileSystemRootFolder);
    const errorMessage = useAppSelector(selectFileSystemError);
    const dispatch = useAppDispatch();
    // TODO: fix search

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
