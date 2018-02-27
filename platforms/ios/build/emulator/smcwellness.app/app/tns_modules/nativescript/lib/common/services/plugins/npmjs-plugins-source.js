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
const parse5 = require("parse5");
const plugins_source_base_1 = require("./plugins-source-base");
class NpmjsPluginsSource extends plugins_source_base_1.PluginsSourceBase {
    constructor($progressIndicator, $logger, $httpClient) {
        super($progressIndicator, $logger);
        this.$progressIndicator = $progressIndicator;
        this.$logger = $logger;
        this.$httpClient = $httpClient;
        this._pages = [];
    }
    get progressIndicatorMessage() {
        return "Searching for plugins in http://npmjs.org.";
    }
    getPlugins(page, count) {
        return __awaiter(this, void 0, void 0, function* () {
            const loadedPlugins = this._pages[page];
            if (loadedPlugins) {
                return loadedPlugins;
            }
            const result = yield this.getPluginsFromNpmjs(this._keywords, page);
            this._pages[page] = result;
            this.plugins = this.plugins.concat(result);
            return result;
        });
    }
    getAllPlugins() {
        return __awaiter(this, void 0, void 0, function* () {
            this.$logger.printInfoMessageOnSameLine("Getting all results, please wait.");
            return yield this.$progressIndicator.showProgressIndicator(this.getAllPluginsCore(), 2000);
        });
    }
    initializeCore(projectDir, keywords) {
        return __awaiter(this, void 0, void 0, function* () {
            this._keywords = keywords;
            this.plugins = yield this.getPluginsFromNpmjs(keywords, 1);
        });
    }
    getAllPluginsCore() {
        return __awaiter(this, void 0, void 0, function* () {
            let result = [];
            let currentPluginsFound = [];
            let page = 1;
            do {
                currentPluginsFound = yield this.getPluginsFromNpmjs(this._keywords, page++);
                if (currentPluginsFound && currentPluginsFound.length) {
                    result = result.concat(currentPluginsFound);
                }
            } while (currentPluginsFound && currentPluginsFound.length);
            return result;
        });
    }
    getPluginsFromNpmjs(keywords, page) {
        return __awaiter(this, void 0, void 0, function* () {
            const pluginName = encodeURIComponent(keywords.join(" "));
            const url = `${NpmjsPluginsSource.NPMJS_ADDRESS}/search?q=${pluginName}&page=${page}`;
            try {
                const responseBody = (yield this.$httpClient.httpRequest(url)).body;
                const document = parse5.parse(responseBody);
                const html = _.find(document.childNodes, (node) => node.nodeName === "html");
                const resultsContainer = this.findNodeByClass(html, "search-results");
                if (!resultsContainer || !resultsContainer.childNodes) {
                    return null;
                }
                const resultsElements = _.filter(resultsContainer.childNodes, (node) => node.nodeName === "li");
                return _.map(resultsElements, (node) => this.getPluginInfo(node));
            }
            catch (err) {
                this.$logger.trace(`Error while getting information for ${keywords} from http://npmjs.org - ${err}`);
                return null;
            }
        });
    }
    getPluginInfo(node) {
        const name = this.getTextFromElementWithClass(node, "name");
        const version = this.getTextFromElementWithClass(node, "version");
        const description = this.getTextFromElementWithClass(node, "description");
        const author = this.getTextFromElementWithClass(node, "author");
        return {
            name,
            version,
            description,
            author
        };
    }
    findNodeByClass(parent, className) {
        if (!parent.childNodes || parent.childNodes.length === 0) {
            return null;
        }
        for (let i = 0; i < parent.childNodes.length; i++) {
            const node = parent.childNodes[i];
            if (_.some(node.attrs, (attr) => attr.name === "class" && attr.value === className)) {
                return node;
            }
            else {
                const result = this.findNodeByClass(node, className);
                if (result) {
                    return result;
                }
            }
        }
    }
    getTextFromElementWithClass(node, className) {
        const element = this.findNodeByClass(node, className);
        if (element && element.childNodes) {
            const textElement = _.find(element.childNodes, (child) => child.nodeName === "#text");
            if (textElement) {
                return textElement.value;
            }
        }
        return null;
    }
}
NpmjsPluginsSource.NPMJS_ADDRESS = "http://npmjs.org";
exports.NpmjsPluginsSource = NpmjsPluginsSource;
