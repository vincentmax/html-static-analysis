/**
 * Created with IntelliJ IDEA.
 * User: Jian-Min Gao [jian-min.gao@hp.com]
 * Date: 2014/12/3
 * Time: 16:19
 */
'use strict';
var fs = require('fs');
var log4js = require('log4js');
var logger = log4js.getLogger('validator');
logger.setLevel(log4js.levels.INFO);
var htmlParser = require('htmlparser2');
var handler = new htmlParser.DefaultHandler(function (error) {
    if (error) {
        logger.fatal('Error occurred during parsing of HTML file');
    }
}, { verbose: false, ignoreWhitespace: true });

var parser = new htmlParser.Parser(handler);
var WhitelistHandler = require('./whitelist-handler');
var utils = require('./static-analysis-utils');

function Validator(wlHandler, grunt, options){
    this.grunt=grunt;
    this.whiteListHandler=wlHandler;
    if(!this.whiteListHandler){
        this.whiteListHandler=new WhitelistHandler();
    }

    this.options= utils.mergeOptions(defaultOpts, options);
}

var defaultOpts = {
    ngFilter: 'translate',
    ngDirective: 'translate',
    failOnError: true,
    logErrors: true
};

Validator.prototype.validateHtml = function (file) {
    if(fs.statSync(file).isDirectory()){
        logger.error('File is a directory. %s', file);
        return null;
    }
    var start=new Date().getMilliseconds();
    logger.debug('Analyzing: %s', file);
    var realFilePath = fs.realpathSync(file);
    /*
     * End validation if the file does not exist.
     */
    if (!fs.existsSync(file)) {
        logger.error('File does not exist: %s', realFilePath);
        return null;
    }

    /*
     * Defines local variables about errors and result
     */
    var errors = [];
    var result = {
        name: 'html static analysis',
        classname: realFilePath,
        status: 'pass',
        messages: [],
        time: 0
    };

    //reads html file content
    var html = fs.readFileSync(file, 'utf-8');

    parser.parseComplete(html);
    var dom = handler.dom;
    var element;

    while (element = dom.shift()) {
        // Check if the element contains the message
        if(this.whiteListHandler.isElementIgnorable(element)){
            continue;
        }

        this.checkHardCoding(element, errors);

        // Expand the element to its children and append to dom for BFS
        if (element.children) {
            dom.push.apply(dom, element.children);
        }
    }

    if(errors.length>0){
        result.status='failed';
        result.messages=errors;

        if (this.options.logErrors) {
            logger.error('%s hard coding issues detected in: %s', errors.length, file);
            errors.forEach(function (msg) {
                logger.error(msg);
            });
            logger.error();
        }

        /*
         * Print errors via grunt
         */
        if(this.grunt){
            var that=this;
            if (that.options.failOnError) {
                this.grunt.log.error('Hard coding detected in: %s', file);
                errors.forEach(function (msg) {
                    that.grunt.fail.warn(msg,3);
                });
            }else{
                that.grunt.log.error('%s errors found in: %s', errors.length, file);
                errors.forEach(function (msg) {
                    that.grunt.log.error(' --> '+msg);
                });
            }
        }
    }

    result.time = (new Date().getMilliseconds() - start)/1000.0;
    return result;
};

Validator.prototype.checkHardCoding=function(element, errors) {
    var msg;
    logger.debug('Checking hard coding for element: %s', element.name);
    var isTranslatableElement = utils.containsDirective(element, this.options.ngDirective);

    //This element is already a translatable element. No need to proceed.
    if(isTranslatableElement){
            logger.debug('Element contains translation directive: %s, text: %s', element.name, element.data);
        return;
    }

    /*
     * Check placeholder text for input elements
     * The placeholder should be treated in this way in the case of angular-translate module
     * <input type="text" placeholder="{{ 'my.i18n.key' | translate }}" ng-model="myModel">
     */
    var placeholderText = utils.getPlaceholderAttributeFromInput(element);
    logger.debug('Placeholder text: %s', placeholderText);
    if(!utils.containsNgTranslateFilter(placeholderText) && !this.whiteListHandler.isTextIgnorable(placeholderText)) {
        msg = 'Hardcoded placeholder. Element: [' + element.name + '], Text: [' + placeholderText + ']';
        errors.push(msg);
        return;
    }

    /*
     * Check child elements
     */
    var children = element.children;
    if (children) {
        var len = children.length;
        var i=0;
        for (i = 0; i < len; i++) {
            var child = children[i];
            if (child.type === 'text') {
                var txtData = child.data.trim().replace(/\s+/i, ' ');

                if (this.isTextHardCoded(txtData)) {
                    msg = 'Hardcoded text. Element: [' + element.name + '], Text: [' + txtData.trim() + ']';
                    errors.push(msg);
                }
            }
        }
    }
};

Validator.prototype.isTextHardCoded = function (text) {
    if(utils.containsFilter(text, this.options.ngFilter)){return false;}
    if(this.whiteListHandler.isTextIgnorable(text)){
        return false;
    }
    return true;
};

module.exports = Validator;