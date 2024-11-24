import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ConfirmationDialog from "../../ui/confirmationDialog/ConfirmationDialog";

describe(ConfirmationDialog, () => {
	it("Calls on cancel on 'Escape' press", async () => {
		// Arrange

		const cancelFn = vi.fn();
		const confirmFn = vi.fn();
		render(
			<div data-testid="container">
				<ConfirmationDialog
					title=""
					text=""
					onCancel={cancelFn}
					onConfirm={confirmFn}
				/>
			</div>,
		);

		// Act

		act(() => {
			const element = screen.getByTestId("container");
			fireEvent.keyUp(element, {
				key: "Escape",
			});
		});

		// Assert

		await waitFor(() => {
			expect(cancelFn).toHaveBeenCalled();
		});
	});

	it("Calls cancel correct", async () => {
		// Arrange

		const cancelFn = vi.fn();
		const confirmFn = vi.fn();
		render(
			<ConfirmationDialog
				title=""
				text=""
				onCancel={cancelFn}
				onConfirm={confirmFn}
			/>,
		);

		// Act

		act(() => {
			screen.getByText("No").click();
		});

		// Assert

		await waitFor(() => {
			expect(cancelFn).toHaveBeenCalled();
		});
	});

	it("Calls confirm correct", async () => {
		// Arrange

		const cancelFn = vi.fn();
		const confirmFn = vi.fn();
		render(
			<ConfirmationDialog
				title=""
				text=""
				onCancel={cancelFn}
				onConfirm={confirmFn}
			/>,
		);

		// Act

		act(() => {
			screen.getByText("Yes").click();
		});

		// Assert

		await waitFor(() => {
			expect(confirmFn).toHaveBeenCalled();
		});
	});
});
