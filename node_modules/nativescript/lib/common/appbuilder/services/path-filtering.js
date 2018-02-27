"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const minimatch = require("minimatch");
class PathFilteringService {
    constructor($fs) {
        this.$fs = $fs;
    }
    getRulesFromFile(fullFilePath) {
        const COMMENT_START = '#';
        let rules = [];
        try {
            const fileContent = this.$fs.readText(fullFilePath);
            rules = _.reject(fileContent.split(/[\n\r]/), (line) => line.length === 0 || line[0] === COMMENT_START);
        }
        catch (e) {
            if (e.code !== "ENOENT") {
                throw e;
            }
        }
        return rules;
    }
    filterIgnoredFiles(files, rules, rootDir) {
        return _.reject(files, file => this.isFileExcluded(file, rules, rootDir));
    }
    isFileExcluded(file, rules, rootDir) {
        file = file.replace(rootDir, "").replace(new RegExp("^[\\\\|/]*"), "");
        let fileMatched = true;
        _.each(rules, rule => {
            const shouldInclude = rule[0] === '!';
            if (shouldInclude) {
                rule = rule.substr(1);
                const ruleMatched = minimatch(file, rule, { nocase: true, dot: true });
                if (ruleMatched) {
                    fileMatched = true;
                }
            }
            else {
                const options = { nocase: true, nonegate: false, dot: true };
                if (rule[0] === '\\' && rule[1] === '!') {
                    rule = rule.substr(1);
                    options.nonegate = true;
                }
                const ruleMatched = minimatch(file, rule, options);
                fileMatched = fileMatched && !ruleMatched;
            }
        });
        return !fileMatched;
    }
}
exports.PathFilteringService = PathFilteringService;
$injector.register("pathFilteringService", PathFilteringService);
