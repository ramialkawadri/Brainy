/** Given the path to a file or a folder and the new name,
  * this method applies the new name on the given file or folder.
  */
function applyNewName(fullPath: string, newName: string) {
    const lastSlashIndex = fullPath.lastIndexOf("/");
    const newFullPath = lastSlashIndex === -1
        ? newName
        : fullPath.substring(0, lastSlashIndex) + "/" + newName;
    return newFullPath;
}

export default applyNewName;
