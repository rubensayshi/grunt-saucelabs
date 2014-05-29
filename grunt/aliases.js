'use strict';

module.exports = function (grunt) {
  var testjobs = ['jscs', 'jshint', 'connect'];
  var positiveTests = [
    'saucelabs-qunit:succeeds',
    'saucelabs-jasmine:succeeds',
    'saucelabs-yui:succeeds',
    'saucelabs-mocha:succeeds',
    'saucelabs-custom:succeeds',
    'saucelabs-custom:callback-succeeds',
    'saucelabs-custom:callback-async-succeeds'
  ];
  var negativeTests = [
    'saucelabs-qunit:fails',
    'saucelabs-jasmine:fails',
    'saucelabs-yui:fails',
    'saucelabs-mocha:fails',
    'saucelabs-custom:fails'
  ];

  if (typeof process.env.SAUCE_ACCESS_KEY !== 'undefined') {
    testjobs = testjobs.concat(positiveTests, negativeTests);
  }

  grunt.registerTask('dev', ['connect', 'watch']);
  grunt.registerTask('test', testjobs);
  grunt.registerTask('default', ['test']);
};