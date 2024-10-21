import { act, render, screen, waitFor } from "@testing-library/react";
import ErrorBox from "../../ui/ErrorBox/ErrorBox";

describe(ErrorBox, () => {
    it("Calls function on close", async () => {
        // Arrange

        const fn = vi.fn();
        render(
            <ErrorBox message="Error" onClose={fn} />
        );

        // Act

        act(() => {
            screen.getByRole("button").click();
        });

        // Assert

        await waitFor(() => {
            expect(fn).toBeCalled();
        });
    });
});
