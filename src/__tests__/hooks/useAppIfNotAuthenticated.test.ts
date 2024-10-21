import { renderHook, waitFor } from "@testing-library/react";
import useLoginIfNotAuthenticated from "../../hooks/useLoginIfNotAuthenticated";
import { mockUseAppSelector, mockUseNavigate } from "../testsUtils/hooks";

describe(useLoginIfNotAuthenticated, () => {
    it("Navigates user when not authenticated", async () => {
        // Arrange

        const useNavigate = mockUseNavigate();
        mockUseAppSelector(false);

        // Act

        renderHook(() => useLoginIfNotAuthenticated());

        // Assert

        await waitFor(() => {
            expect(useNavigate).toHaveBeenCalledWith("/login");
        });
    });

    it("Does nothing when user authenticated", async () => {
        // Arrange

        const useNavigate = mockUseNavigate();
        mockUseAppSelector(true);

        // Act

        renderHook(() => useLoginIfNotAuthenticated());

        // Assert

        await waitFor(() => {
            expect(useNavigate).not.toHaveBeenCalledWith("/login");
        });
    });
});
