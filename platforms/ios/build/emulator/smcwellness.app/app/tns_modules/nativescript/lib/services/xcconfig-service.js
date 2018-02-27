"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class XCConfigService {
    constructor($fs) {
        this.$fs = $fs;
    }
    readPropertyValue(xcconfigFilePath, propertyName) {
        if (this.$fs.exists(xcconfigFilePath)) {
            const text = this.$fs.readText(xcconfigFilePath);
            let property;
            let isPropertyParsed = false;
            text.split(/\r?\n/).forEach((line) => {
                line = line.replace(/\/(\/)[^\n]*$/, "");
                if (line.indexOf(propertyName) >= 0) {
                    const parts = line.split("=");
                    if (parts.length > 1 && parts[1]) {
                        property = parts[1].trim();
                        isPropertyParsed = true;
                        if (property[property.length - 1] === ';') {
                            property = property.slice(0, -1);
                        }
                    }
                }
            });
            if (isPropertyParsed) {
                return property;
            }
        }
        return null;
    }
}
exports.XCConfigService = XCConfigService;
$injector.register("xCConfigService", XCConfigService);
