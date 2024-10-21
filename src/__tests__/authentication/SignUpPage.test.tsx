import { fireEvent, render, screen, act, waitFor } from "@testing-library/react";
import { AxiosResponse } from "axios";
import SignUpPage from "../../features/authentication/SignUpPage";
import { spyOnBackend } from "../testsUtils/backend";
import { MemoryRouter } from "react-router-dom";
import { mockUseApi, mockUseAppDispatch } from "../testsUtils/hooks";
import { setIsLoggedIn } from "../../features/authentication/authenticationSlice";
import * as useAppIfAuthenticated from "../../hooks/useAppIfAuthenticated";

describe(SignUpPage, () => {
    const { registerSpy } = spyOnBackend();

    beforeAll(() => {
        registerSpy.mockResolvedValue({} as AxiosResponse<void, unknown>);
        vi.spyOn(useAppIfAuthenticated, "default").mockReturnValue();
    });

    function renderSignUpPage() {
        render(
            <MemoryRouter>
                <SignUpPage />
            </MemoryRouter>
        );
    }

    function fillFields(
        firstName: string,
        lastName: string,
        email: string,
        username: string,
        password: string,
        passwordConfirmation?: string) {
        act(() => {
            const firstNameField = screen.getByLabelText("First Name")
            fireEvent.change(firstNameField, { target: { value: firstName } });

            const lastNameField = screen.getByLabelText("Last Name")
            fireEvent.change(lastNameField, { target: { value: lastName} });

            const emailField = screen.getByLabelText("Email")
            fireEvent.change(emailField, { target: { value: email } });

            const usernameField = screen.getByLabelText("Username")
            fireEvent.change(usernameField, { target: { value: username } });

            const passwordField = screen.getByLabelText("Password");
            fireEvent.change(passwordField, { target: { value: password } });

            const passwordConfirmationField =
                screen.getByLabelText("Confirm your password");
            fireEvent.change(passwordConfirmationField, {
                target: { value: passwordConfirmation ?? password }
            });

            screen.getByText("Signup", { selector: "button" }).click();
        });
    }

    it("Calls api correctly", async () => {
        // Arrange

        const useApi = mockUseApi();
        useApi.mockReturnValue({ status: 200 });
        const useAppDispatch = mockUseAppDispatch();

        // Act

        renderSignUpPage();
        fillFields("First-Name", "Last-Name", "test@test.com", "username", "*");

        // Assert

        await waitFor(() => {
            expect(registerSpy).toHaveBeenCalledWith({
                username: "username",
                password: "*",
                firstName: "First-Name",
                lastName: "Last-Name",
                email: "test@test.com",
            });
            expect(useApi).toHaveBeenCalled();
            expect(useAppDispatch).toHaveBeenCalledWith(setIsLoggedIn(true));
        });
    });

    it("Shows error", async () => {
        // Arrange

        const useApi = mockUseApi();
        useApi.mockReturnValue({
            status: 400,
            data: { detail: "Username already exists!" }
        });
        mockUseAppDispatch();

        // Act

        renderSignUpPage();
        fillFields("First-Name", "Last-Name", "test@test.com", "username", "*");

        // Assert

        await waitFor(() => {
            screen.getByText("Username already exists!");
        });
    });

    it("Verify password confirmation is correct", async () => {
        // Arrange

        const useApi = mockUseApi();
        useApi.mockReturnValue({ status: 200 });
        mockUseAppDispatch();

        // Act

        renderSignUpPage();
        fillFields("First-Name", "Last-Name", "test@test.com", "username", "*", "confirmation");

        // Assert

        await waitFor(() => {
            screen.getByText("Your passwords doesn't match!");
        });
    });
});
