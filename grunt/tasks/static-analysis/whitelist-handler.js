/**
 * Created with IntelliJ IDEA.
 * User: Jian-Min Gao [jian-min.gao@hp.com]
 * Date: 2014/12/2
 * Time: 16:56
 */
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('WhitelistHandler');
logger.setLevel(log4js.levels.INFO);
var utils = require('./static-analysis-utils');

var defaultWhitelist = {
    paths:[
        /.+package\.html/i
    ],
    tags:[
        /pre|code/
    ],
    strings:[
        /[\u2000-\u206F\u0080-\u00bf]+/i,
        /\s*[\d\+\-\.]+\s*/, // numbers only
        /(&nbsp;)+/ //white spaces
    ],
    /*
     * This property configures strings containing angular expressions. It is the same in effect as the string patterns.
     * But it's easier to define the patterns here. Usage:
     * Use '%##%' to represent an angular expression. The pattern will be processed internally to match a ng-expression.
     * For example, if you want strings like '({{previewEntity.phaseDisplayLabel}})' to be ignored, define the pattern like this:
     * /\(%##%\)/ig
     */
    ngExpressions:[
        /\(%##%\)/ig
    ],
    //non-translatable symbols
    symbols:/%\*:\-'">\\S/
};

var ngExpression=/\{\{.+\}\}/ig;


function WhitelistHandler(whitelist){
    this.whitelist={
      paths:[],tags:[],strings:[],ngExpressions:[],symbols:undefined
    };
    mergeWhitelist(this.whitelist, defaultWhitelist);
    if (whitelist) {
        mergeWhitelist(this.whitelist, whitelist);
    }
    rebuildNgExpressions(this.whitelist);
    if (logger.isLevelEnabled(log4js.levels.DEBUG)) {
        logger.debug('merged whitelist: %s',utils.convertToString(this.whitelist));

    }
}


WhitelistHandler.prototype.isNgExpression = function (text) {
    if(!text||text.trim().length<1){return false;}
    var ngExpr=/^\{\{.+\}\}$/ig;
    return ngExpr.test(text.trim());
};

WhitelistHandler.prototype.isTextIgnorable = function (text) {
    if(!text || text.trim().length<1){ return true;}//text is null/undefined
    var cleansedText=text.replace(/(&nbsp;?)*/ig,'').trim();
    if(cleansedText.length<1){ return true;}//text is null/undefined
    if(this.isNgExpression(cleansedText)){return true;}//The text is an angular expression


    /*
     * First check if the strings are symbols/white spaces
     */
    var symbolPattern=makeExactMatchRegex('['+this.whitelist.symbols.source+'\\s]+');
    if(cleansedText.match(symbolPattern)){
        logger.debug('The text is composed of symbols only. "%s"', text);
        return true;
    }

    var mergedStringPatterns=this.whitelist.ngExpressions;
    Array.prototype.push.apply(mergedStringPatterns, this.whitelist.strings);

    var isIgnorable = matchPatterns(mergedStringPatterns, cleansedText, true);
    logger.debug('Is text ignorable? %s: %s', isIgnorable, text);
    return isIgnorable;
};

WhitelistHandler.prototype.isElementIgnorable=function(element){
    if (element.type !== 'tag') {return true;  }
    var isIgnorable = false;
    logger.debug('Checking element: %s', element.name);

    //check custom rules
    isIgnorable = matchPatterns(this.whitelist.tags, element.name, true);
    return isIgnorable;
};

WhitelistHandler.prototype.isPathIgnorable= function (path) {
    if(!path){ return true;}//text is null/undefined
    if(path.trim().length<1){return true;}
    var isIgnorable=false;
    logger.debug('Path to be checked: %s', path);
    /*
     * Convert path strings to Unix style paths
     */
    path = path.replace(/\\/g, '/');

    //check custom rules
    isIgnorable = matchPatterns(this.whitelist.paths, path, false,true);
    return isIgnorable;
};


function rebuildNgExpressions (whitelist) {
    whitelist.ngExpressions.forEach(function (expr, index) {
        if(expr.source){
            var pattern=expr.source.replace(/(?:%##%)/ig,ngExpression.source);
            whitelist.ngExpressions[index]=pattern;
            logger.debug('Calculated ng-expression pattern: %s', pattern);
        }
    });

    if(whitelist.symbols) {
        var symbolPattern='['+whitelist.symbols.source+'\\d\\s]*';
        var builtInPattern=symbolPattern+ngExpression.source+symbolPattern;
        whitelist.ngExpressions.push(builtInPattern);
    }

}

/**
 * The whitelist contains the following properties:
 * tags: array type
 * paths: array type
 * strings: array type
 * ngExpressions: array type
 * @param internalWhitelist
 * @param whitelist
 * @returns {*}
 */
function mergeWhitelist(internalWhitelist, whitelist){
    if(!whitelist){return internalWhitelist;}
    //paths
    if(whitelist.hasOwnProperty('paths')){
        Array.prototype.push.apply(internalWhitelist.paths, whitelist.paths);
    }
    if(whitelist.hasOwnProperty('tags')){
        Array.prototype.push.apply(internalWhitelist.tags, whitelist.tags);
    }
    if(whitelist.hasOwnProperty('strings')){
        Array.prototype.push.apply(internalWhitelist.strings, whitelist.strings);
    }
    if(whitelist.hasOwnProperty('ngExpressions')){
        Array.prototype.push.apply(internalWhitelist.ngExpressions, whitelist.ngExpressions);
    }

    /*
     * merges the symbols
     */
    if(whitelist.symbols){
        if (internalWhitelist.symbols) {
            var internalSymbol=internalWhitelist.symbols.source+whitelist.symbols.source;

            logger.debug('merged symbols: %s', internalSymbol);
            internalWhitelist.symbols = new RegExp(internalSymbol);
        }else{
            internalWhitelist.symbols=whitelist.symbols;
        }
    }
    return internalWhitelist;
}
function matchPatterns(patterns, text, exactMatch,normalizeFileSeparator){
    var patternLen=patterns.length;
    //console.log('text['+text+']');
    for (var i=0;i<patternLen;i++) {
        var pattern;
        if (exactMatch) {
            pattern = makeExactMatchRegex(patterns[i]);
        }else if(patterns[i] instanceof RegExp){
            pattern = patterns[i].source;
        }else{
            pattern = patterns[i];
        }

        if(normalizeFileSeparator){
            pattern=pattern.replace(/\\\\/g,'/');
            /*
            //insert file separator before the pattern
            if(pattern.indexOf('/')!==0){
                pattern='/'+pattern;
            }

            //append file separator after the pattern
            if(pattern.lastIndexOf('/')!==pattern.length-1){
                pattern = pattern + '/';
            }
            */
        }
        var regex=new RegExp(pattern,'i');
        
        logger.debug('Finalized regex pattern: %s', regex.source);
        if(regex.test(text)){
            return true;
        }
    }
    return false;
}

function makeExactMatchRegex(regex){
    var exactMatchRegex;
    if (regex instanceof RegExp) {
        exactMatchRegex=regex.source;
    }else{
        exactMatchRegex = regex;
    }

    if (exactMatchRegex.indexOf('^')!==0) {
        exactMatchRegex='^'+exactMatchRegex;
    }
    if (exactMatchRegex.lastIndexOf('$')!==exactMatchRegex.length-1) {
        exactMatchRegex += '$';
    }
//    logger.debug('exact match regex: ' + exactMatchRegex);
    return exactMatchRegex;
}
module.exports = WhitelistHandler;