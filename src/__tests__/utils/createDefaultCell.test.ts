import createDefaultCell from "../../utils/createDefaultCell";
import Cell from "../../types/backend/cell";

describe(createDefaultCell, () => {
	it("Note", () => {
		// Arrange

		const fileId = 2;
		const index = 3;
		const expected: Cell = {
			cellType: "Note",
			content: "",
			fileId,
			index,
		};

		// Act

		const actual = createDefaultCell("Note", fileId, index);

		// Assert

		expect(actual).toStrictEqual(expected);
	});
});
