/** Given the path to a file or a folder and the new name,
  * this method applies the new name on the given file or folder.
  */
function renameFile(currentFullPath: string, newName: string) {
    const lastSlashIndex = currentFullPath.lastIndexOf("/");
    const newFullPath = lastSlashIndex === -1
        ? newName
        : currentFullPath.substring(0, lastSlashIndex) + "/" + newName;
    return newFullPath;
}

export default renameFile;
