import { AxiosResponse } from "axios";
import getErrorFromAxiosResponse from "../../utils/getErrorFromAxiosResponse";

describe(getErrorFromAxiosResponse, () => {
    it("Returns data", () => {
        // Arrange

        const data = {};

        // Act

        const actual = getErrorFromAxiosResponse({ data } as AxiosResponse);

        // Assert

        expect(actual).toBe(data);
    })
});
