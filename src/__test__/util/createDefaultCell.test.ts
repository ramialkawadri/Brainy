import createDefaultCell from "../../util/createDefaultCell";
import Cell from "../../type/backend/entity/cell";

describe(createDefaultCell, () => {
	it("Note", () => {
		// Arrange

		const fileId = 2;
		const index = 3;
		const expected: Cell = {
			cellType: "Note",
			content: "",
            searchableContent: "",
			fileId,
			index,
		};

		// Act

		const actual = createDefaultCell("Note", fileId, index);

		// Assert

		expect(actual).toStrictEqual(expected);
	});
});
