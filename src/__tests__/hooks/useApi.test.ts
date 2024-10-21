import { AxiosResponse } from "axios";
import useApi from "../../hooks/useApi";
import { mockUseAppDispatch } from "../testsUtils/hooks";
import { renderHook } from "@testing-library/react";
import { setIsLoggedIn } from "../../features/authentication/authenticationSlice";

describe(useApi, () => {
    it("Returns result correctly", async () => {
        // Arrange

        const appDispatch = mockUseAppDispatch();
        const { result } = renderHook(() => useApi());

        // Act

        const actual = await result.current(Promise.resolve(
            { status: 200, data: "result" } as AxiosResponse<string, void>
        ));

        // Assert

        expect(appDispatch).not.toHaveBeenCalledWith(setIsLoggedIn(false));
        expect(actual).toStrictEqual({ status: 200, data: "result" });
    });

    it("Sets logged in to false on 401 response", async () => {
        // Arrange

        const appDispatch = mockUseAppDispatch();
        const { result } = renderHook(() => useApi());

        // Act

        await result.current(Promise.resolve(
            { status: 401 } as AxiosResponse<void, void>
        ));

        // Assert

        expect(appDispatch).toHaveBeenCalledWith(setIsLoggedIn(false));
    });
});
