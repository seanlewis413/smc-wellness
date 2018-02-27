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
const util = require("util");
class MicroTemplateService {
    constructor($dynamicHelpService, $injector) {
        this.$dynamicHelpService = $dynamicHelpService;
        this.$injector = $injector;
        this.dynamicCallRegex = new RegExp(util.format("(%s)", this.$injector.dynamicCallRegex.source), "g");
    }
    parseContent(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const localVariables = this.$dynamicHelpService.getLocalVariables(options);
            const compiledTemplate = _.template(data.replace(this.dynamicCallRegex, "this.$injector.getDynamicCallData(\"$1\")"));
            return yield compiledTemplate.apply(this, [localVariables]);
        });
    }
}
exports.MicroTemplateService = MicroTemplateService;
$injector.register("microTemplateService", MicroTemplateService);
