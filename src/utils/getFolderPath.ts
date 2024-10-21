// Returns the path of the parent folder of the given file.
function getFolderPath(filePath: string) {
    const index = filePath.lastIndexOf("/");
    return index === -1 ? "" : filePath.substring(0, index);
}

export default getFolderPath;
