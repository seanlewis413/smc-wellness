"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers = require("../common/helpers");
function RunTestCommandFactory(platform) {
    return function RunTestCommand($options, $testExecutionService, $projectData, $analyticsService) {
        $projectData.initializeProjectData();
        $analyticsService.setShouldDispose($options.justlaunch || !$options.watch);
        const projectFilesConfig = helpers.getProjectFilesConfig({ isReleaseBuild: $options.release });
        this.execute = (args) => $testExecutionService.startTestRunner(platform, $projectData, projectFilesConfig);
        this.allowedParameters = [];
    };
}
$injector.registerCommand("dev-test|android", RunTestCommandFactory('android'));
$injector.registerCommand("dev-test|ios", RunTestCommandFactory('iOS'));
function RunKarmaTestCommandFactory(platform) {
    return function RunKarmaTestCommand($options, $testExecutionService, $projectData, $analyticsService) {
        $projectData.initializeProjectData();
        $analyticsService.setShouldDispose($options.justlaunch || !$options.watch);
        const projectFilesConfig = helpers.getProjectFilesConfig({ isReleaseBuild: $options.release });
        this.execute = (args) => $testExecutionService.startKarmaServer(platform, $projectData, projectFilesConfig);
        this.allowedParameters = [];
    };
}
$injector.registerCommand("test|android", RunKarmaTestCommandFactory('android'));
$injector.registerCommand("test|ios", RunKarmaTestCommandFactory('iOS'));
