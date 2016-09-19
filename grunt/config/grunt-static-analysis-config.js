/**
 * Created with IntelliJ IDEA.
 * User: Jian-Min Gao [jian-min.gao@hp.com]
 * Date: 2014/12/18
 * Time: 11:47
 */
module.exports = function (grunt) {
    'use strict';

    grunt.config.set('html-static-analysis', {
        options: {
            reportLocation: './target/reports', //directory where the reports will be kept
            reportFormat: 'text',// possible values: xml/text
            whitelistFile: '../config/grunt-static-analysis-whitelist.js', // the path is relative to 'tasks/grunt-static-analysis.js'
            ngFilter: 'i18nf',
            ngDirective: '',
            failOnError: false,
            logErrors: false // true to print the errors with log4js
        },
		itba: {
            options: {
                ngFilter: 'ng-i18next',
                ngDirective: 'ng-i18next',
                reportBaseName: 'static-analysis-itba'
            },
            src:[
                'C:/Projects/ITBA/btoe-dev-program/**/*.html',
            ]
        },
		omi: {
            options: {
                ngFilter: 'oprL10n',
                ngDirective: 'oprL10n',
                reportBaseName: 'static-analysis-omi'
            },
            src:[
                'C:/Projects/StaticCodeAnalysis/Sources/opr-reference-project/**/*.html',
            ]
        },
        csa: {
            options: {
                ngFilter: 'translate',
                ngDirective: 'translate',
                reportBaseName: 'static-analysis-csa'
            },
            src:[
                'C:/Projects/StaticCodeAnalysis/Sources/CSA_4.7_html/**/*.html',
            ]
        },
		hpmc: {
            options: {
                ngFilter: 't',
                ngDirective: 't',
                reportBaseName: 'static-analysis-hpmc'
            },
            src:[
                'C:/Projects/StaticCodeAnalysis/Sources/HPMC/**/*.html',
            ]
        },
		ooCentral: {
            options: {
                ngFilter: 'data-bind',
                ngDirective: 'data-bind',
                reportBaseName: 'static-analysis-OO_Central_HTML'
            },
            src:[
                'C:/Projects/StaticCodeAnalysis/Sources/OO_Central_HTML/**/*.html',
            ]
        },
		srl: {
            options: {
                ngFilter: 'translate',
                ngDirective: 'translate',
                reportBaseName: 'static-analysis-srl'
            },
            src:[
                'C:/Projects/StaticCodeAnalysis/Sources/SRL/**/*.html',
            ]
        },
		ssc: {
            options: {
                ngFilter: 'i18n',
                ngDirective: '',
                reportBaseName: 'static-analysis-ssc'
            },
            src:[
                'C:/Projects/StaticCodeAnalysis/Sources/ssc-html/**/*.html',
            ]
        },
        webui: {
            options: {
                ngFilter: 'translate',
                ngDirective: 'translate',
                reportBaseName: 'static-analysis-webui'
            },
            src:[
                'C:/QC/Views/Git/alm_mng/Server/alm-web-ui/app/ui/**/*.html',
                'C:/QC/Views/Git/alm_mng/Server/alm-web-ui/app/authentication-point/**/*.html'
            ]
        },
        saw: {
            options: {
                reportBaseName: 'static-analysis-saw',
                ngDirective: null
            },
            src:[
                'D:/Projects/Static Code Analysis/data/SAW/code/ui/app/js/**/*.html'
            ]
        },
        appPulse: {
            options: {
                ngFilter: 'translate',
                ngDirective: 'translate',
                reportBaseName: 'static-analysis-appPulse'
            },
            src:[
                'D:/_SVN-WC/AppPulse_webapp/main/server/web/**/*.html'
            ]
        }
    });
};