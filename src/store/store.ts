import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import persistStore from "redux-persist/es/persistStore";
import fileSystemReducer from "./reducers/fileSystemReducers";

const reducers = combineReducers({
	fileSystem: fileSystemReducer,
});

const persistedReducer = persistReducer(
	{
		key: "root",
		storage,
	},
	reducers,
);

export const store = configureStore({
	reducer: persistedReducer,
	middleware: getDefaultMiddleware =>
		getDefaultMiddleware({
			serializableCheck: false,
		}),
});
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
