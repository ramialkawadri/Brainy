import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import MainAppPage from "./features/mainApp/MainAppPage";
import { persistor, store } from "./store/store.ts";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <MainAppPage />
            </PersistGate>
        </Provider>
    </React.StrictMode>,
);
