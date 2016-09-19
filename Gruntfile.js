/**
 * Created with IntelliJ IDEA.
 * User: Jian-Min Gao [jian-min.gao@hp.com]
 * Date: 2014/12/8
 * Time: 14:19
 */
module.exports = function(grunt) {
    /*
     * Loads custom grunt tasks
     */
    grunt.loadTasks('./grunt/config/');
    grunt.loadTasks('./grunt/tasks/');


    /*
     * Basic tasks
     */

    grunt.registerTask('default', ['html-static-analysis']);
};
