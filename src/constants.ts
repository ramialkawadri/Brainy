import { generatorParameters } from "ts-fsrs";
import { BrainyBackendApi } from "./services/backendApi";
import Database from "@tauri-apps/plugin-sql";

const backendApi = new BrainyBackendApi({
    baseURL: import.meta.env.VITE_API_URL,
    validateStatus: () => true, // Don't throw errors on non 200-response
    withCredentials: true,
}).api;

const autoSaveDelay = 5000;
const FSRSParameters = generatorParameters({
    w: [
        0.4872,
        1.4003,
        3.7145,
        4.0,
        5.1618,
        1.2298,
        0.8975,
        0.031,
        1.6474,
        0.1367,
        1.0461,
        2.1072,
        0.0793,
        0.3246,
        1.587,
        0.2272,
        2.8755,
    ],
    maximum_interval: 36500,
    request_retention: 0.9,
});

let database: Database | null = null;

const createTablesCommand = `
CREATE TABLE IF NOT EXISTS user_files (
    id          TEXT        PRIMARY KEY,
    path        TEXT        NOT NULL,
    isFolder    INTEGER     NOT NULL,
    UNIQUE(path, isFolder)
);

`;

export async function getDatabase() {
    if (database === null) {
        database = await Database.load('sqlite:test.db');
        await database.execute(createTablesCommand);
    }
    return database;
}

export { backendApi, autoSaveDelay, FSRSParameters };
