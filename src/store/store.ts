import { combineReducers, configureStore } from "@reduxjs/toolkit";
import fileSystemReducer from "./reducers/fileSystemReducers";
import selectedFileCellsReducer from "./reducers/selectedFileCellsReducers";

const reducers = combineReducers({
	fileSystem: fileSystemReducer,
	selectedFileCells: selectedFileCellsReducer,
});

export const store = configureStore({
	reducer: reducers,
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
