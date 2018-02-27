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
const url = require("url");
const os_1 = require("os");
const helpers = require("./helpers");
const zlib = require("zlib");
const util = require("util");
const constants_1 = require("./constants");
const request = require("request");
class HttpClient {
    constructor($config, $logger, $proxyService, $staticConfig) {
        this.$config = $config;
        this.$logger = $logger;
        this.$proxyService = $proxyService;
        this.$staticConfig = $staticConfig;
    }
    httpRequest(options, proxySettings) {
        return __awaiter(this, void 0, void 0, function* () {
            if (_.isString(options)) {
                options = {
                    url: options,
                    method: "GET"
                };
            }
            const unmodifiedOptions = _.clone(options);
            if (options.url) {
                const urlParts = url.parse(options.url);
                if (urlParts.protocol) {
                    options.proto = urlParts.protocol.slice(0, -1);
                }
                options.host = urlParts.hostname;
                options.port = urlParts.port;
                options.path = urlParts.path;
            }
            const requestProto = options.proto || "http";
            const body = options.body;
            delete options.body;
            let pipeTo = options.pipeTo;
            delete options.pipeTo;
            const cliProxySettings = yield this.$proxyService.getCache();
            options.headers = options.headers || {};
            const headers = options.headers;
            yield this.useProxySettings(proxySettings, cliProxySettings, options, headers, requestProto);
            if (!headers.Accept || headers.Accept.indexOf("application/json") < 0) {
                if (headers.Accept) {
                    headers.Accept += ", ";
                }
                else {
                    headers.Accept = "";
                }
                headers.Accept += "application/json; charset=UTF-8, */*;q=0.8";
            }
            if (!headers["User-Agent"]) {
                if (!this.defaultUserAgent) {
                    this.defaultUserAgent = `${this.$staticConfig.USER_AGENT_NAME}/${this.$staticConfig.version} (Node.js ${process.versions.node}; ${process.platform}; ${process.arch})`;
                    this.$logger.debug("User-Agent: %s", this.defaultUserAgent);
                }
                headers["User-Agent"] = this.defaultUserAgent;
            }
            if (!headers["Accept-Encoding"]) {
                headers["Accept-Encoding"] = "gzip,deflate";
            }
            const result = new Promise((resolve, reject) => {
                let timerId;
                const promiseActions = {
                    resolve,
                    reject,
                    isResolved: () => false
                };
                if (options.timeout) {
                    timerId = setTimeout(() => {
                        this.setResponseResult(promiseActions, timerId, { err: new Error(`Request to ${unmodifiedOptions.url} timed out.`) });
                    }, options.timeout);
                    delete options.timeout;
                }
                options.url = options.url || `${options.proto}://${options.host}${options.path}`;
                options.encoding = null;
                options.followAllRedirects = true;
                this.$logger.trace("httpRequest: %s", util.inspect(options));
                const requestObj = request(options);
                requestObj
                    .on("error", (err) => {
                    this.$logger.trace("An error occurred while sending the request:", err);
                    const errorMessageMatch = err.message.match(HttpClient.STATUS_CODE_REGEX);
                    const errorMessageStatusCode = errorMessageMatch && errorMessageMatch[1] && +errorMessageMatch[1];
                    const errorMessage = this.getErrorMessage(errorMessageStatusCode, null);
                    err.proxyAuthenticationRequired = errorMessageStatusCode === constants_1.HttpStatusCodes.PROXY_AUTHENTICATION_REQUIRED;
                    err.message = errorMessage || err.message;
                    this.setResponseResult(promiseActions, timerId, { err });
                })
                    .on("response", (response) => {
                    const successful = helpers.isRequestSuccessful(response);
                    if (!successful) {
                        pipeTo = undefined;
                    }
                    let responseStream = response;
                    switch (response.headers["content-encoding"]) {
                        case "gzip":
                            responseStream = responseStream.pipe(zlib.createGunzip());
                            break;
                        case "deflate":
                            responseStream = responseStream.pipe(zlib.createInflate());
                            break;
                    }
                    if (pipeTo) {
                        pipeTo.on("finish", () => {
                            this.$logger.trace("httpRequest: Piping done. code = %d", response.statusCode.toString());
                            this.setResponseResult(promiseActions, timerId, { response });
                        });
                        responseStream.pipe(pipeTo);
                    }
                    else {
                        const data = [];
                        responseStream.on("data", (chunk) => {
                            data.push(chunk);
                        });
                        responseStream.on("end", () => {
                            this.$logger.trace("httpRequest: Done. code = %d", response.statusCode.toString());
                            const responseBody = data.join("");
                            if (successful) {
                                this.setResponseResult(promiseActions, timerId, { body: responseBody, response });
                            }
                            else {
                                const errorMessage = this.getErrorMessage(response.statusCode, responseBody);
                                const err = new Error(errorMessage);
                                err.response = response;
                                err.body = responseBody;
                                this.setResponseResult(promiseActions, timerId, { err });
                            }
                        });
                    }
                });
                this.$logger.trace("httpRequest: Sending:\n%s", this.$logger.prepare(body));
                if (!body || !body.pipe) {
                    requestObj.end(body);
                }
                else {
                    body.pipe(requestObj);
                }
            });
            const response = yield result;
            if (helpers.isResponseRedirect(response.response)) {
                if (response.response.statusCode === constants_1.HttpStatusCodes.SEE_OTHER) {
                    unmodifiedOptions.method = "GET";
                }
                this.$logger.trace("Begin redirected to %s", response.headers.location);
                unmodifiedOptions.url = response.headers.location;
                return yield this.httpRequest(unmodifiedOptions);
            }
            return response;
        });
    }
    setResponseResult(result, timerId, resultData) {
        return __awaiter(this, void 0, void 0, function* () {
            if (timerId) {
                clearTimeout(timerId);
                timerId = null;
            }
            if (!result.isResolved()) {
                result.isResolved = () => true;
                if (resultData.err) {
                    return result.reject(resultData.err);
                }
                const finalResult = resultData;
                finalResult.headers = resultData.response.headers;
                result.resolve(finalResult);
            }
        });
    }
    getErrorMessage(statusCode, body) {
        if (statusCode === constants_1.HttpStatusCodes.PROXY_AUTHENTICATION_REQUIRED) {
            const clientNameLowerCase = this.$staticConfig.CLIENT_NAME.toLowerCase();
            this.$logger.error(`You can run ${os_1.EOL}\t${clientNameLowerCase} proxy set <url> <username> <password>.${os_1.EOL}In order to supply ${clientNameLowerCase} with the credentials needed.`);
            return "Your proxy requires authentication.";
        }
        else if (statusCode === constants_1.HttpStatusCodes.PAYMENT_REQUIRED) {
            const subscriptionUrl = util.format("%s://%s/appbuilder/account/subscription", this.$config.AB_SERVER_PROTO, this.$config.AB_SERVER);
            return util.format("Your subscription has expired. Go to %s to manage your subscription. Note: After you renew your subscription, " +
                "log out and log back in for the changes to take effect.", subscriptionUrl);
        }
        else {
            this.$logger.trace("Request was unsuccessful. Server returned: ", body);
            try {
                const err = JSON.parse(body);
                if (_.isString(err)) {
                    return err;
                }
                if (err && err.ExceptionMessage) {
                    return err.ExceptionMessage;
                }
                if (err && err.Message) {
                    return err.Message;
                }
            }
            catch (parsingFailed) {
                this.$logger.trace("Failed to get error from http request: ", parsingFailed);
                return `The server returned unexpected response: ${body}`;
            }
            return body;
        }
    }
    useProxySettings(proxySettings, cliProxySettings, options, headers, requestProto) {
        return __awaiter(this, void 0, void 0, function* () {
            if (proxySettings || cliProxySettings) {
                const proto = (proxySettings && proxySettings.protocol) || cliProxySettings.protocol || "http:";
                const host = (proxySettings && proxySettings.hostname) || cliProxySettings.hostname;
                const port = (proxySettings && proxySettings.port) || cliProxySettings.port;
                let credentialsPart = "";
                if (cliProxySettings.username && cliProxySettings.password) {
                    credentialsPart = `${cliProxySettings.username}:${cliProxySettings.password}@`;
                }
                options.proxy = `${proto}//${credentialsPart}${host}:${port}`;
                options.rejectUnauthorized = proxySettings ? proxySettings.rejectUnauthorized : cliProxySettings.rejectUnauthorized;
                this.$logger.trace("Using proxy: %s", options.proxy);
            }
        });
    }
}
HttpClient.STATUS_CODE_REGEX = /statuscode=(\d+)/i;
exports.HttpClient = HttpClient;
$injector.register("httpClient", HttpClient);
