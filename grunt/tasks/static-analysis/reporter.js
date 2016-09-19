/**
 * Created with IntelliJ IDEA.
 * User: Jian-Min Gao [jian-min.gao@hp.com]
 * Date: 2014/12/8
 * Time: 14:19
 */
'use strict';
var fs = require('fs');
var path = require('path');
var utils = require('./static-analysis-utils');
var log4js = require('log4js');
var logger = log4js.getLogger('reporter');
logger.setLevel('DEBUG');


function StaticAnalysisReporter(options){
    this.options=utils.mergeOptions(defaultOpts, options);
}

var defaultOpts={
    reportFormat: 'text',
    reportBaseName: 'static-analysis-report'
};

StaticAnalysisReporter.prototype.generateReport= function (destDir, executionResults) {
    if(fs.statSync(destDir).isFile()){
        logger.fatal('Destination directory is a file: %s', destDir);
        return false;
    }
    if(!executionResults){ return false;}

    var reportDir=fs.realpathSync(destDir);
    if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir);
    }

    var baseName=this.options.reportBaseName;
    if(baseName.trim()===''){
        baseName='static-analysis-report';
    }
    var targetFile = path.join(reportDir, baseName);


    targetFile+=this.options.reportFormat.toLowerCase()==='xml'?'.xml':'.txt';
    logger.info('Generating report: [%s]', targetFile);

    switch (this.options.reportFormat) {
        case 'xml':
            generateJunitXMLReport(targetFile, executionResults,false);
            break;
        case 'text':
            generateTextReport(targetFile, executionResults);
            break;
        default:
            generateTextReport(targetFile, executionResults);
            break;
    }
};

function generateTextReport(reportFile,execReport) {
    var newline = '\r\n';
    var separator = '################################################################################' ;
    var summary = newline+'##\t' + execReport.name + ':\t' + execReport.failures + ' errors detected in ' + execReport.tests + ' files.'+ newline;
    var content = separator + summary+separator + newline;
    execReport.results.forEach(function(result){
        if(result.status==='failed'){
            content+=newline+result.classname +newline;
            result.messages.forEach(function(message){
                content+=message +newline;
            });
            content+='================================================================================' +newline;
        }
    });

    content+=newline+separator + summary+separator;

    fs.writeFileSync(path.normalize(reportFile), content, {flag: 'w+'});
}

function generateJunitXMLReport(reportFile,execReport, includeAll){
    var builder = require('xmlbuilder');
    var duration=0.0;
    var obj ={
        testsuites :{
            testsuite: {
                '@name': execReport.name,
                '@failures': execReport.failures,
                '@errors':execReport.errors,
                '@time': execReport.time,
                '@tests': execReport.tests,
                '@timestamp': execReport.timestamp,
                '#list':function(){
                    var tetscases=[];
                    execReport.results.forEach(function(result){
                        duration+=result.time;
                        if(result.status==='pass' && includeAll){
                            tetscases.push({ testcase: {
                                '@name': result.name,
                                '@classname': result.classname,
                                '@status': result.status,
                                '@time': result.time
                            }
                            });
                        }
                        if(result.status==='failed'){
                            tetscases.push({ testcase: {
                                '@name': result.name,
                                '@classname': result.classname,
                                '@status': result.status,
                                '@time': result.time,
                                '#list': function(){
                                    var data=[];
                                    result.messages.forEach(function(message){
                                        data.push({failure: {
                                            '@message': 'Hard coding detected',
                                            '#text': message.replace(/Hardcoded (\w+)\.\s*/ig,'')
                                        }});
                                    });
                                    return data;
                                }
                            }
                            });
                        }
                    });
                    return tetscases;
                }
            }
        }
    };
    var root = builder.create(obj).end({ pretty: true});
    fs.writeFileSync(reportFile, root, {flag: 'w+'});

}

module.exports =StaticAnalysisReporter;