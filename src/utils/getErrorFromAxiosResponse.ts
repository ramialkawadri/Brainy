import { AxiosResponse } from "axios";

function getErrorFromAxiosResponse<E>(response: AxiosResponse) {
    return response.data as E;
}

export default getErrorFromAxiosResponse;
