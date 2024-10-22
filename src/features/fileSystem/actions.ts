import { getDatabase } from "../../constants";
import { v4 as uuidv4 } from "uuid";
import parseListUserFilesResponse from "../../utils/parseListUserFilesResponse";
import { AppDispatch, RootState } from "../../store";
import { requestFailure, requestStart, requestSuccess, setSelectedFilePath } from "./fileSystemSlice";
import Database from "@tauri-apps/plugin-sql";
import IUserFileEntity from "../../entities/userFileEntity";
import getFolderPath from "../../utils/getFolderPath";
import getFileName from "../../utils/getFileName";
import { selectFileSelectedFilePath } from "./selectors";
import applyNewName from "../../utils/applyNewName";

export function fetchFiles() {
    return executeRequest(getUserFiles);
}

export function createFile(path: string) {
    return executeRequest(async () => {
        if (!path.trim()) throw Error("Name cannot be empty");

        const db = await getDatabase();
        if (await entityExists(db, path, false)) {
            throw Error("File already exists!");
        }
        if (path.includes("/")) {
            await createFolderRecursively(db, getFolderPath(path));
        }
        await db.execute(
            "INSERT INTO user_files(id, path, isFolder) VALUES ($1, $2, $3)",
            [uuidv4(), path, 0]);
    });
}

export function createFolder(path: string) {
    return executeRequest(async () => {
        if (!path.trim()) throw Error("Name cannot be empty");

        const db = await getDatabase();
        if (await entityExists(db, path, true)) {
            throw Error("Folder already exists!");
        }
        await createFolderRecursively(db, path);
    });
}

export function deleteFile(path: string) {
    return executeRequest(async (dispatch, state) => {
        const db = await getDatabase();
        await db.execute(
            "DELETE FROM user_files WHERE path = $1",
            [path]);

        if (selectFileSelectedFilePath(state) === path) {
            dispatch(setSelectedFilePath(null));
        }
    });
}

export function deleteFolder(path: string) {
    return executeRequest(async (dispatch, state) => {
        const db = await getDatabase();
        await db.execute(
            "DELETE FROM user_files WHERE path LIKE concat($1, '/%')",
            [path]);
        await db.execute(
            "DELETE FROM user_files WHERE path = $1 AND isFolder = 1",
            [path]);

        if (selectFileSelectedFilePath(state).startsWith(path)) {
            dispatch(setSelectedFilePath(null));
        }
    });
}

export function moveFile(path: string, destinationFolder: string) {
    return executeRequest(async (dispatch, state) => {
        const db = await getDatabase();
        const fileName = getFileName(path);
        const newPath = destinationFolder === ""
            ? fileName
            : `${destinationFolder}/${fileName}`;

        if (await entityExists(db, newPath, false)) {
            throw Error("File already exists!");
        }
        await db.execute(
            "UPDATE user_files SET path = $1 WHERE path = $2 AND isFolder = 0",
            [newPath, path]);

        if (selectFileSelectedFilePath(state) === path) {
            dispatch(setSelectedFilePath(newPath));
        }
    });
}

export function renameFile(path: string, newName: string) {
    return executeRequest(async (dispatch, state) => {
        if (!newName.trim()) {
            throw Error("Please enter a non empty name!");
        }
        const newPath = applyNewName(path, newName);
        const db = await getDatabase();
        if (await entityExists(db, newPath, false)) {
            throw Error("File already exists!");
        }
        await db.execute(
            "UPDATE user_files SET path = $1 WHERE path = $2 AND isFolder = 0",
            [newPath, path]);


        if (selectFileSelectedFilePath(state) === path) {
            dispatch(setSelectedFilePath(newPath));
        }
    });
}

// TODO: this might be the same as moving a folder
export function renameFolder(path: string, newName: string) {
    return executeRequest(async (dispatch, state) => {
        if (!newName.trim()) {
            throw Error("Please enter a non empty name!");
        }

        const newPath = applyNewName(path, newName);
        const db = await getDatabase();
        if (await entityExists(db, newPath, true)) {
            throw Error("Another folder with the same name exists")
        }

        await createFolderRecursively(db, newPath);
        console.log("here");
        await db.execute(
            "DELETE FROM user_files WHERE path = $1 AND isFolder = 1",
            [path]);

        const existingEntities: {id: string, path: string}[] = await db.select(
            "SELECT id, path FROM user_files WHERE path LIKE concat($1, '/%')",
            [path]
        );

        for (const existingEntity of existingEntities) {
            const newEntityPath = newPath + existingEntity.path.substring(path.length);
            console.log(newEntityPath);
            await db.execute(
                "UPDATE user_files SET path = $1 WHERE id = $2",
                [newEntityPath, existingEntity.id]);
        }

        const selectedFile = selectFileSelectedFilePath(state);
        if (selectedFile.startsWith(path)) {
            const newSelectedFilePath =
                newPath + "/" + selectedFile.substring(path.length + 1);
            dispatch(setSelectedFilePath(newSelectedFilePath));
        }
    });
}


async function entityExists(db: Database, path: string, isFolder: boolean) {
    interface IResultType {
        isExisting: number
    };
    const result: IResultType[] = await db.select(
        "SELECT EXISTS(SELECT 1 FROM user_files WHERE path = $1 AND isFolder = $2) AS isExisting",
        [path, isFolder ? 1 : 0]);

    return result[0].isExisting === 1;
}

function executeRequest<T>(cb: (dispatch: AppDispatch, state: RootState) => Promise<T>) {
    return async function(dispatch: AppDispatch, getState: () => RootState) {
        try {
            dispatch(requestStart());
            await cb(dispatch, getState());
            dispatch(requestSuccess(await getUserFiles()));
        } catch (e) {
            console.error(e);
            if (e instanceof Error) {
                dispatch(requestFailure(e.message));
                console.error(e.stack);
            }
        }
    }
}

async function getUserFiles() {
    const db = await getDatabase();
    const result: IUserFileEntity[] = await db.select(
        "SELECT id, path, isFolder FROM user_files");
    console.log(result);
    const folder = parseListUserFilesResponse(result);
    return folder
}

async function createFolderRecursively(db: Database, path: string) {
    const folderNames = path.split("/");
    let currentPath = "";

    for (const folderName of folderNames) {
        if (currentPath.length > 0) currentPath += "/";

        currentPath += folderName;
        if (await entityExists(db, currentPath, true)) {
            continue;
        }
        await db.execute(
            "INSERT INTO user_files(id, path, isFolder) VALUES ($1, $2, 1)",
            [uuidv4(), currentPath]);
    }
    console.log("end");
}
