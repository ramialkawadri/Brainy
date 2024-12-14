import { mdiCardMultipleOutline, mdiHelp, mdiNoteOutline } from "@mdi/js";
import getCellIcon from "../../util/getCellIcon";
import { CellType } from "../../type/backend/entity/cell";

describe(getCellIcon, () => {
	it("Returns correct icon", () => {
		// Arrange

		const typesIcons = [
			["FlashCard", mdiCardMultipleOutline],
			["Note", mdiNoteOutline],
			["other", mdiHelp],
		];

		// Act & Assert

		for (const typeIcon of typesIcons) {
			const actual = getCellIcon(typeIcon[0] as CellType);
			expect(actual).toBe(typeIcon[1]);
		}
	});
});
