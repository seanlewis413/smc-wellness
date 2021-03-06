"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
class AndroidProjectPropertiesManager {
    constructor($propertiesParser, $logger, directoryPath) {
        this.$propertiesParser = $propertiesParser;
        this.$logger = $logger;
        this._editor = null;
        this.filePath = null;
        this.dirty = false;
        this.filePath = path.join(directoryPath, "project.properties");
    }
    getProjectReferences() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.projectReferences || this.dirty) {
                const allProjectProperties = yield this.getAllProjectProperties();
                const allProjectPropertiesKeys = _.keys(allProjectProperties);
                this.projectReferences = _(allProjectPropertiesKeys)
                    .filter(key => _.startsWith(key, "android.library.reference."))
                    .map(key => this.createLibraryReference(key, allProjectProperties[key]))
                    .value();
            }
            return this.projectReferences;
        });
    }
    addProjectReference(referencePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const references = yield this.getProjectReferences();
            const libRefExists = _.some(references, r => path.normalize(r.path) === path.normalize(referencePath));
            if (!libRefExists) {
                yield this.addToPropertyList("android.library.reference", referencePath);
            }
        });
    }
    removeProjectReference(referencePath) {
        return __awaiter(this, void 0, void 0, function* () {
            const references = yield this.getProjectReferences();
            const libRefExists = _.some(references, r => path.normalize(r.path) === path.normalize(referencePath));
            if (libRefExists) {
                yield this.removeFromPropertyList("android.library.reference", referencePath);
            }
            else {
                this.$logger.error(`Could not find ${referencePath}.`);
            }
        });
    }
    createEditor() {
        return __awaiter(this, void 0, void 0, function* () {
            return this._editor || (yield this.$propertiesParser.createEditor(this.filePath));
        });
    }
    buildKeyName(key, index) {
        return `${key}.${index}`;
    }
    getAllProjectProperties() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.$propertiesParser.read(this.filePath);
        });
    }
    createLibraryReference(referenceName, referencePath) {
        return {
            idx: parseInt(referenceName.split("android.library.reference.")[1]),
            key: referenceName,
            path: referencePath,
            adjustedPath: path.join(path.dirname(this.filePath), referencePath)
        };
    }
    addToPropertyList(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const editor = yield this.createEditor();
            let i = 1;
            while (editor.get(this.buildKeyName(key, i))) {
                i++;
            }
            editor.set(this.buildKeyName(key, i), value);
            yield this.$propertiesParser.saveEditor();
            this.dirty = true;
        });
    }
    removeFromPropertyList(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const editor = yield this.createEditor();
            const valueLowerCase = value.toLowerCase();
            let i = 1;
            let currentValue;
            while (currentValue = editor.get(this.buildKeyName(key, i))) {
                if (currentValue.toLowerCase() === valueLowerCase) {
                    while (currentValue = editor.get(this.buildKeyName(key, i + 1))) {
                        editor.set(this.buildKeyName(key, i), currentValue);
                        i++;
                    }
                    editor.set(this.buildKeyName(key, i));
                    break;
                }
                i++;
            }
            yield this.$propertiesParser.saveEditor();
            this.dirty = true;
        });
    }
}
exports.AndroidProjectPropertiesManager = AndroidProjectPropertiesManager;
