module.exports = class PersistentObject {
    constructor() {
        this.lastModified = null;
        this.creationDate = null;
        this.UUID = null;
    }

    getLastModified() {}
    getCreationDate() {}
    __id() {}
    getUUID() {}
};
