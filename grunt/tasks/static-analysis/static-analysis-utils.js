/**
 * Created with IntelliJ IDEA.
 * User: Jian-Min Gao [jian-min.gao@hp.com]
 * Date: 2014/12/2
 * Time: 13:11
 */
'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('static-analysis-utils');
logger.setLevel(log4js.levels.INFO);
/**
 * Check if the given DOM element contains angular-translate directive. The translate directive can be used in
 * the following ways:
 * &lt;ANY translate&gt;TRANSLATION_ID&lt;/ANY&gt; // Use content as translation id
 &lt;ANY translate="TRANSLATION_ID"&gt;&lt;/ANY&gt; // Pass translation id as attribute value
 &lt;ANY translate&gt;{{translationIdOnScope}}&lt;/ANY&gt; // Use content as translation id with string interpolation
 &lt;ANY translate="{{translationIdOnScope}}"&gt;&lt;/ANY&gt; // You got the point
 * @param element
 * @returns {boolean}
 */
exports.containsNgTranslateDirective= function (element) {
    return this.containsDirective(element,'translate');
};


exports.containsDirective=function (element, directive){
    if(!element || element.type !== 'tag') { return false;}
    if(!directive||directive.trim().length<1) { return false;}
    logger.debug('Checking element %s for directive: %s',element.name, directive);
    /*
     * if the directive is the element name, return true
     */
    if(element.name === directive){
        logger.debug('The directive is an element: %s', directive);
        return true;
    }

    /*
     * If the directive is an attribute, returns true
     */
    if(element.attribs.hasOwnProperty(directive)){
        logger.debug('Found directive in attributes: %s', directive);
        return true;
    }
    return false;
};

exports.containsFilter= function (text, filter) {
    if(!text||!filter){ return false;}
    if(text.trim().length<1||filter.trim().length<1){
        return false;
    }
    var placeholderRegex=/\{\{.+\}\}/i;
    var isPlaceholder = placeholderRegex.test(text);
    //The text is not an angular placeholder at all.
    if (!isPlaceholder) { return false; }

    var filterPattern='\\{\\{.+\\|\\s*'+filter+'.*\\}\\}';
    var filterRegex = new RegExp(filterPattern, 'i');
    return filterRegex.test(text);
};

exports.containsNgTranslateFilter = function (text) {
    return this.containsFilter(text, 'translate');
};

exports.getPlaceholderAttributeFromInput = function (element) {
    /*
     * Directly return false if the element is not input or it does not have any attribute
     */
    if(element.name !=='input'|| !element.attribs) {
        return null;
    }
    var attrName = 'placeholder';
    if(!element.attribs.hasOwnProperty(attrName)){
        return null;
    }

    return element.attribs.placeholder;
};

exports.convertToString= function (obj) {
  if(obj instanceof Object){
      var util = require('util');
      return '\n'+util.inspect(this.whitelist)+'\n';
  }else{
      return obj.toString();
  }
};

/**
 * Merges the values in the second options object into the first one. Null/Undefined values are ignored.
 * Values in options2 will normally overwrite the values in options1.
 * @param options1
 * @param options2
 * @returns {*}
 */
exports.mergeOptions = function (options1, options2) {
    if(!options2){return options1;}
    var data=JSON.parse(JSON.stringify(options1));
    for(var prop in data){
        if(data.hasOwnProperty(prop) && options2.hasOwnProperty(prop)){
            var value2=options2[prop];
            if(value2 === null || value2 === undefined) {
                continue;
            }
            data[prop]=value2;
        }
    }
    return data;
};