"use strict";
require("./bootstrap");
$injector.overrideAlreadyRequiredModule = true;
$injector.requirePublic("companionAppsService", "./common/appbuilder/services/livesync/companion-apps-service");
$injector.requirePublicClass("deviceEmitter", "./common/appbuilder/device-emitter");
$injector.requirePublicClass("deviceLogProvider", "./common/appbuilder/device-log-provider");
$injector.resolve("staticConfig").disableAnalytics = true;
