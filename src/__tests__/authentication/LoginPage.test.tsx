import { fireEvent, render, screen, act, waitFor } from "@testing-library/react";
import LoginPage from "../../features/authentication/LoginPage";
import { MemoryRouter } from "react-router-dom";
import { setIsLoggedIn } from "../../features/authentication/authenticationSlice";
import { AxiosResponse } from "axios";
import { mockUseApi, mockUseAppDispatch } from "../testsUtils/hooks";
import * as useAppIfAuthenticated from "../../hooks/useAppIfAuthenticated";
import { spyOnBackend } from "../testsUtils/backend";

describe(LoginPage, () => {
    const { loginSpy } = spyOnBackend();

    beforeAll(() => {
        vi.spyOn(useAppIfAuthenticated, "default").mockReturnValue();
        loginSpy.mockResolvedValue({} as AxiosResponse<void, unknown>);
    });

    function renderLoginPage() {
        render(
            <MemoryRouter>
                <LoginPage />
            </MemoryRouter>
        );
    }

    it("Calls api correctly", async () => {
        // Arrange

        const useApi = mockUseApi();
        useApi.mockReturnValue({ status: 200 });
        const useAppDispatch = mockUseAppDispatch();

        // Act

        renderLoginPage();
        act(() => {
            const username = screen.getByLabelText("Username");
            fireEvent.change(username, { target: { value: "My-Username" } });

            const password = screen.getByLabelText("Password");
            fireEvent.change(password, { target: { value: "My-Password" } });

            screen.getByText("Login", { selector: "button" }).click();
        });

        // Assert

        await waitFor(() => {
            expect(loginSpy).toHaveBeenCalledWith({
                username: "My-Username",
                password: "My-Password",
            });
            expect(useApi).toHaveBeenCalled();
            expect(useAppDispatch).toHaveBeenCalledWith(setIsLoggedIn(true));
        });
    });

    it("Shows error", async () => {
        // Arrange

        const useApi = mockUseApi();
        useApi.mockReturnValue({ status: 401 });
        mockUseAppDispatch();

        // Act

        renderLoginPage();
        act(() => {
            const username = screen.getByLabelText("Username");
            fireEvent.change(username, { target: { value: "My-username" } });

            const password = screen.getByLabelText("Password");
            fireEvent.change(password, { target: { value: "My-Password" } });

            screen.getByText("Login", { selector: "button" }).click();
        });

        // Assert

        await waitFor(() => {
            screen.getByText("Wrong username or password!");
        });
    });
});
