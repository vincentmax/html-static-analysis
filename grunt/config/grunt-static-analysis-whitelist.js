/*
 * white list definition
 *
 * The white list is defined on 3 levels:
 * - file level: tells which files should be ignored
 * - tag level: tells which HTML tags should be ignored
 * - string level: tells which strings should be ignored
 */
exports.whitelist={
    /*
     * Patterns for file paths. The value can be path fragments like 'Windows' in path 'C:\Windows\'or
     * full path names
     */
    paths: [
        /.*[\/](demo)[\/].*/i, // file paths
        /.+(package|example.*|\d)\.html/ig, // file names
        /demo|debug|lib|target|automation|expample|test|dev/i // file paths. Each item here means a fragment in file path
    ],

    /*
     * Patterns for text strings for elements.
     */
    strings:[
        /(\:\s*\)\()?\{\{.+?\}\}\1/ig, // keep it as-is
        /[\(\)!]+/g, //symbols: (,),!
        /\s*\d+\s*/ig, //numbers
        '^([ \'\".^@%,*\\}\\{?/+|;:-]+\\s*$|px)',//symbols, keep it for now
        /\\[.+\\]/i, //strings like [HOME_PATH]
        '(&[^;]+;)+',
        /%[\w\-]+%/ig, //variables like %JAVA_HOME%
		/MOBILE CENTER/,
		/\$\{.*\}/,
		/StormRunner/,
		/HPE/,
		/SiteScope/,
			/SiteScope on Prem/,
		/http[s]?:\/\/.*?/
    ],

    /*
     * Patterns for tags that should be ignored.
     */
    tags:[
        /pre|code/ig
    ],

    /*
     * Non-translatable symbols go here. The data type for symbols should be RegExp. Occurrence pattern is not needed.
     */
    symbols:/\*\/\|×+/,

    /*
     * This property configures strings containing angular expressions. It is the same in effect as the string patterns.
     * But it's easier to define the patterns here. Usage:
     * Use '%##%' to represent an angular expression. The pattern will be processed internally to match a ng-expression.
     * For example, if you want strings like '({{previewEntity.phaseDisplayLabel}})' to be ignored, define the pattern like this:
     * /\(%##%\)/ig
     */
    ngExpressions:[
        /\(%##%\)/ig,
		/\[%##%\]/ig,
        /%##%\s+\(%##%\)/i
    ]
};