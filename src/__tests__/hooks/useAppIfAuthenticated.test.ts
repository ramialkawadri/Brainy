import { renderHook, waitFor } from "@testing-library/react";
import useAppIfAuthenticated from "../../hooks/useAppIfAuthenticated";
import { mockUseAppSelector, mockUseNavigate } from "../testsUtils/hooks";

describe(useAppIfAuthenticated, () => {
    it("Navigates user when authenticated", async () => {
        // Arrange

        const useNavigate = mockUseNavigate();
        mockUseAppSelector(true);

        // Act

        renderHook(() => useAppIfAuthenticated());

        // Assert

        await waitFor(() => {
            expect(useNavigate).toHaveBeenCalledWith("/app");
        });
    });

    it("Does nothing when user not authenticated", async () => {
        // Arrange

        const useNavigate = mockUseNavigate();
        mockUseAppSelector(false);

        // Act

        renderHook(() => useAppIfAuthenticated());

        // Assert

        await waitFor(() => {
            expect(useNavigate).not.toHaveBeenCalledWith("/app");
        });
    });
});
