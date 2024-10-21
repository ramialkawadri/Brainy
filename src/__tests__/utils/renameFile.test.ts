import renameFile from "../../utils/renameFile";

describe(renameFile, () => {
    it("Handles file in a directory", () => {
        // Arrange

        const path = "dir/file 1";

        // Act
        
        const actual = renameFile(path, "file 2");

        // Assert

        expect(actual).toBe("dir/file 2");
    });

    it("Handles file in a base directory", () => {
        // Arrange

        const path = "file 1";

        // Act
        
        const actual = renameFile(path, "file 2");

        // Assert

        expect(actual).toBe("file 2");
    });
});
