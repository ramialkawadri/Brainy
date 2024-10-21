import Database from "@tauri-apps/plugin-sql";

const autoSaveDelay = 5000;


// TODO: move
let database: Database | null = null;

const createTablesCommand = `
CREATE TABLE IF NOT EXISTS user_files (
    id          TEXT        PRIMARY KEY,
    path        TEXT        NOT NULL,
    isFolder    INTEGER     NOT NULL,
    UNIQUE(path, isFolder)
);

`;

async function getDatabase() {
    if (database === null) {
        database = await Database.load('sqlite:test.db');
        await database.execute(createTablesCommand);
    }
    return database;
}

export { autoSaveDelay, getDatabase };
