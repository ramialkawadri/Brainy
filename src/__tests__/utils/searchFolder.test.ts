import Folder from "../../types/folder";
import UiFolder from "../../types/uiFolder";
import searchFolder from "../../utils/searchFolder";

describe(searchFolder, () => {
	it("Searches folder correctly", () => {
		// Arrange

		const folder: Folder = {
			id: 0,
			name: "",
			files: [
				{
					id: 1,
					name: "search",
				},
				{
					id: 2,
					name: "not visible",
				},
			],
			subFolders: [
				{
					id: 3,
					name: "test",
					subFolders: [],
					files: [
						{
							id: 4,
							name: "search file",
						},
					],
				},
				{
					id: 4,
					// Should not be visible since none of its files include "search".
					name: "search",
					subFolders: [],
					files: [],
				},
			],
		};
		const expected: UiFolder = {
			id: 0,
			name: "",
			isVisible: true,
			files: [
				{
					id: 1,
					name: "search",
					isVisible: true,
				},
				{
					id: 2,
					name: "not visible",
					isVisible: false,
				},
			],
			subFolders: [
				{
					id: 3,
					name: "test",
					subFolders: [],
					isVisible: true,
					files: [
						{
							id: 4,
							name: "search file",
							isVisible: true,
						},
					],
				},
				{
					id: 4,
					// Should not be visible since none of its files include "search".
					name: "search",
					subFolders: [],
					files: [],
					isVisible: false,
				},
			],
		};

		// Act

		const actual = searchFolder(folder, "search");

		// Assert

		expect(actual).toStrictEqual(expected);
	});
});
