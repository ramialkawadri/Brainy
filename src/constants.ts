import { generatorParameters } from "ts-fsrs";
import { BrainyBackendApi } from "./services/backendApi";

const backendApi = new BrainyBackendApi({
    baseURL: import.meta.env.VITE_API_URL,
    validateStatus: () => true, // Don't throw errors on non 200-response
    withCredentials: true,
}).api;

const selectedFileQueryStringParameter = "file";
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

export { backendApi, selectedFileQueryStringParameter, autoSaveDelay, FSRSParameters };
