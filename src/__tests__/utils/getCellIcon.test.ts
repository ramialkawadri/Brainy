import { mdiCardMultipleOutline, mdiHelp, mdiNoteOutline } from "@mdi/js";
import { CellType } from "../../services/backendApi";
import getCellIcon from "../../utils/getCellIcon";

describe(getCellIcon, () => {
	it("Returns correct icon", () => {
		// Arrange

		const typesIcons = [
			[CellType.FlashCard, mdiCardMultipleOutline],
			[CellType.Note, mdiNoteOutline],
			["other", mdiHelp],
		];

		// Act & Assert

		for (const typeIcon of typesIcons) {
			const actual = getCellIcon(typeIcon[0] as CellType);
			expect(actual).toBe(typeIcon[1]);
		}
	});
});
