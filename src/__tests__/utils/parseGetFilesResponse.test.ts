import File from "../../entities/file";
import Folder from "../../types/folder";
import parseGetFilesResponse from "../../utils/parseGetFilesResponse";

describe(parseGetFilesResponse, () => {
	it("Parse file list correctly", () => {
		// Arrange

		const response: File[] = [
			{
				id: 1,
				path: "file 1",
				// repetitionCounts: { new: 1, review: 2, learning: 2, relearning: 0 },
				isFolder: false,
			},
			{
				id: 2,
				path: "folder 1",
				isFolder: true,
				// repetitionCounts: {},
			},
			{
				id: 3,
				path: "folder 1/folder 2",
				isFolder: true,
				// repetitionCounts: {},
			},
			{
				id: 4,
				path: "folder 3",
				isFolder: true,
				// repetitionCounts: {},
			},
			{
				id: 5,
				path: "folder 1/file 1",
				isFolder: false,
				// repetitionCounts: {},
			},
			{
				id: 6,
				path: "folder 1/file 2",
				isFolder: false,
				// repetitionCounts: { new: 5, review: 9, learning: 15, relearning: 2 },
			},
			{
				id: 7,
				path: "folder 1/folder 2/file 1",
				isFolder: false,
				// repetitionCounts: { new: 1, review: 1, learning: 1, relearning: 1 },
			},
			{
				id: 8,
				path: "folder 1/folder 2/file 2",
				isFolder: false,
				// repetitionCounts: { new: 0, review: 0, learning: 0, relearning: 0 },
			},
			{
				id: 9,
				path: "folder 3/file 1",
				isFolder: false,
				// repetitionCounts: { new: 0, review: 0, learning: 0, relearning: 1 },
			},
		];

		const folder2: Folder = {
			id: 3,
			name: "folder 2",
			/*repetitionCounts: {
                new: 1, review: 1, learning: 1, relearning: 1,
            },*/
			subFolders: [],
			files: [
				{
					id: 7,
					name: "file 1" /* repetitionCounts: {
                    new: 1, review: 1, learning: 1, relearning: 1,
                }*/,
				},
				{
					id: 8,
					name: "file 2" /* repetitionCounts: {
                    new: 0, review: 0, learning: 0, relearning: 0,
                }*/,
				},
			],
		};
		const folder1: Folder = {
			id: 2,
			name: "folder 1",
			/*repetitionCounts: {
                new: 6, review: 10, learning: 17, relearning: 6,
            },*/
			files: [
				{
					id: 5,
					name: "file 1" /*repetitionCounts: {
                    new: 0, review: 0, learning: 1, relearning: 3,
                }*/,
				},
				{
					id: 6,
					name: "file 2" /*repetitionCounts: {
                    new: 5, review: 9, learning: 15, relearning: 2,
                }*/,
				},
			],
			subFolders: [folder2],
		};
		const folder3: Folder = {
			id: 4,
			name: "folder 3",
			/*repetitionCounts: {
                new: 0, review: 0, learning: 0, relearning: 1,
            },*/
			files: [
				{
					id: 9,
					name: "file 1" /*repetitionCounts: {
                new: 0, review: 0, learning: 0, relearning: 1,
            }*/,
				},
			],
			subFolders: [],
		};
		const expected: Folder = {
			id: 0,
			name: "",
			/*repetitionCounts: {
                new: 7, review: 12, learning: 19, relearning: 7,
            },*/
			files: [
				{
					id: 1,
					name: "file 1" /*repetitionCounts: {
                new: 1, review: 2, learning: 2, relearning: 0,
            }*/,
				},
			],
			subFolders: [folder1, folder3],
		};

		// Act

		const actual = parseGetFilesResponse(response);

		// Assert

		expect(actual).toStrictEqual(expected);
	});
});
