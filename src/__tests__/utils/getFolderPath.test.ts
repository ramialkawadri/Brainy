import getFolderPath from "../../utils/getFolderPath";

describe(getFolderPath, () => {
    it("Works on full path", () => {
        // Arrange

        const path = "dir 1/dir 2/file";

        // Act
        
        const actual = getFolderPath(path);

        // Assert
        
        expect(actual).toBe("dir 1/dir 2");
    });

    it("Works on just a file name", () => {
        // Arrange

        const path = "dir";

        // Act
        
        const actual = getFolderPath(path);

        // Assert
        
        expect(actual).toBe("");
    });
});
