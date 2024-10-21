import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { Provider } from "react-redux";
import { persistor, store } from "./store.ts";
import { PersistGate } from "redux-persist/integration/react";
import MainAppPage from "./features/mainApp/MainAppPage.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <Provider store={store}>
            <PersistGate loading={null} persistor={persistor}>
                <MainAppPage />
            </PersistGate>
        </Provider>
    </React.StrictMode>,
)
