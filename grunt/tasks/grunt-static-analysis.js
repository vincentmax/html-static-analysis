/**
 * The html-static-analysis is a multi task grunt script which scans all HTML files for potential hard coding issues.
 *
 * It does the following:
 * 1. Parses each HTML file as a HTML DOM if the file is not ignorable per WHITE_LIST
 * 2. Retrieves all text strings between elements and strings for input placeholders.
 * 3. The strings are checked first against the white list and then the i18n filter pattern.
 * 4. If a string does not match all the above conditions, the string is considered to be a hard coding issue.
 *
 *  * Grunt tasks stops on first failure
 * unless '-–force' is specified in command line. In non-verbose mode, the output only contains problems,
 * while only -'-verbose' mode is specified, the full report regarding which files are actually been scanned display
 * in console.
 *
 *
 * For each sub-task configuration it is possible to specify the following properties:
 * 1. src (mandatory) - the list of HTML patterns are need to scan. for example:
 * 2. ignoreFiles (optional) - the white list to tell script which files should be ignored.
 *
 * The following example demonstrate how to configure a sub-task:
 *     'saw-ui': {
 *          src: ['saw-ui/app/js/**//*.html']
 *      }
 */

'use strict';
module.exports = function (grunt) {
    var fs = require('fs');
    var log4js = require('log4js');
    var logger = log4js.getLogger('grunt-static-analysis');
    logger.setLevel(log4js.levels.WARN);

    function modifyOptions(options) {
        var data=options;
        data.whitelistFile = grunt.option('whitelist-file') || options.whitelistFile;

        //reporting stuff
        data.reportLocation = grunt.option('report-dir') || options.reportLocation;
        data.reportFormat = grunt.option('report-format') || options.reportFormat;
        data.reportBaseName=grunt.option('report-base-name')||options.reportBaseName;

        data.ngFilter = grunt.option('ng-filter') || options.ngFilter;
        data.ngDirective = grunt.option('ng-directive') || options.ngDirective;
        var failOnError=grunt.option('fail-on-error');
        if(failOnError !== undefined){
            logger.debug('fail-on-error: %s',failOnError);
            data.failOnError=failOnError;
        }else{
            data.failOnError=options.failOnError;
        }
        var logErrors = grunt.option('log-errors');
        if(logErrors !== undefined) {
            data.logErrors=logErrors;
        }else{
            data.logErrors=options.logErrors;
        }
        return data;
    }
    grunt.registerMultiTask('html-static-analysis', 'Analyze all HTML templates for potential hard coding issues.', function () {
        var Validator = require('./static-analysis/validator');
        var WhitelistHandler = require('./static-analysis/whitelist-handler');
        var configOptions = modifyOptions(this.options());
        var whitelist=require(configOptions.whitelistFile).whitelist;
        var wlHandler = new WhitelistHandler(whitelist);
        var validator = new Validator(wlHandler,grunt,configOptions);
        var errCount = 0;
        var executionResult={
            name: 'I18N static analysis',
            failures: errCount,
            time: 0,
            tests: 0,
            errors: 0,
            timestamp: new Date().toISOString()
        };
        var duration=0.0;
        var results=[];
        var fileWithErrors=0;
        this.files.forEach(function (f) {
            f.src.forEach(function (filePath) {
                if(!fs.existsSync(filePath)){
                    grunt.log.writeln('File does not exist: %s', filePath);
                    return false;
                }
                /*
                 * If the file path matches the ignorable patterns defined in the white list file, the file won't be checked.
                 */
                logger.debug('Checking file %s', filePath);
                var isIgnoredPath = wlHandler.isPathIgnorable(filePath);
                if(isIgnoredPath){
                    logger.info('Ignored file/path: '+filePath);
                    return false;
                }

                var realPath=fs.realpathSync(filePath);
                grunt.verbose.writeln('Checking... ' + realPath);
                var result=validator.validateHtml(realPath);
                results.push(result);
                if(result.status==='failed'){
                    fileWithErrors++;
                    errCount +=result.messages.length;
                }
                duration += result.time;
            });
        });

        executionResult.failures=errCount;
        executionResult.tests=fileWithErrors;
        executionResult.results=results;
        executionResult.time=duration;
        grunt.log.writeln(errCount+' errors detected in '+fileWithErrors+ ' files.');

        /*
         * Generate execution report
         */
        var StaticAnalysisReporter = require('./static-analysis/reporter');
        var reportFile=configOptions.reportLocation;
        console.log('Report file location: %s', reportFile);
        grunt.file.mkdir(reportFile);
        var reporter=new StaticAnalysisReporter(configOptions);
        reporter.generateReport(reportFile,executionResult);
    });
};