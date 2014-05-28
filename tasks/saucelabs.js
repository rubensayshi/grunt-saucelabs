'use strict';

module.exports = function (grunt) {
  var Q = require('q');
  var TestRunner = require('../src/TestRunner');
  var Tunnel = require('../src/Tunnel');
  var notifications = require('../src/notifications');

  function reportProgress(notification) {
    console.log(JSON.stringify(notification));
    switch (notification.type) {
    case notifications.tunnelOpen:
      grunt.log.writeln('=> Starting Tunnel to Sauce Labs'.inverse.bold);
      break;
    case notifications.tunnelOpened:
      grunt.log.ok('Connected to Saucelabs');
      break;
    case notifications.tunnelClose:
      grunt.log.writeln('=> Stopping Tunnel to Sauce Labs'.inverse.bold);
      break;
    case notifications.tunnelEvent:
      if (notification.verbose) {
        grunt.verbose[notification.method](notification.text);
      } else {
        grunt.log[notification.method](notification.text);
      }
      break;
    case notifications.jobStarted:
      grunt.log.writeln('\n', notification.startedJobs, '/', notification.numberOfJobs, 'tests started');
      break;
    case notifications.jobCompleted:
      grunt.log.subhead('\nTested %s', notification.url);
      grunt.log.writeln('Platform: %s', notification.platform);

      if (notification.tunnelId && unsupportedPort(notification.url)) {
        grunt.log.writeln('Warning: This url might use a port that is not proxied by Sauce Connect.'.yellow);
      }

      grunt.log.writeln('Passed: %s', notification.passed);
      grunt.log.writeln('Url %s', notification.url);
      break;
    case notifications.testCompleted:
      grunt.log[notification.passed ? 'ok' : 'error']('All tests completed with status %s', notification.passed);
      break;
    default:
      grunt.log.error('Unexpected notification type');
    }
  }

  function runTask(arg, framework, callback) {
    var tunnel;

    Q
      .fcall(function () {
        if (arg.tunneled) {
          tunnel = new Tunnel(arg, reportProgress);
          arg.identifier = tunnel.id;
          return tunnel.open();
        }
      })
      .then(function () {
        var testRunner = new TestRunner(arg, framework, reportProgress);
        return testRunner.runTests();
      })
      .fin(function () {
        if (tunnel) {
          return tunnel.close();
        }
      })
      .then(
        function (passed) {
          callback(passed);
        },
        function (error) {
          grunt.log.error(error.toString());
          callback(false);
        }
      )
      .done();
  }

  function unsupportedPort(url) {
    // Not all ports are proxied by Sauce Connect. List of supported ports is
    // available at https://saucelabs.com/docs/connect#localhost
    var portRegExp = /:(\d+)\//;
    var matches = portRegExp.exec(url);
    var port = matches ? parseInt(matches[1], 10) : null;
    var supportedPorts = [80, 443, 888, 2000, 2001, 2020, 2109, 2222, 2310, 3000, 3001, 3030,
      3210, 3333, 4000, 4001, 4040, 4321, 4502, 4503, 4567, 5000, 5001, 5050, 5555, 5432, 6000,
      6001, 6060, 6666, 6543, 7000, 7070, 7774, 7777, 8000, 8001, 8003, 8031, 8080, 8081, 8765,
      8888, 9000, 9001, 9080, 9090, 9876, 9877, 9999, 49221, 55001];

    if (port) {
      return supportedPorts.indexOf(port) === -1;
    }

    return false;
  }

  var defaults = {
    username: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    tunneled: true,
    identifier: Math.floor((new Date()).getTime() / 1000 - 1230768000).toString(),
    testInterval: 1000 * 2,
    testReadyTimeout: 1000 * 5,
    testname: '',
    browsers: [{}],
    tunnelArgs: [],
    sauceConfig: {}
  };

  grunt.registerMultiTask('saucelabs-jasmine', 'Run Jasmine test cases using Sauce Labs browsers', function () {
    var done = this.async();
    var arg = this.options(defaults);

    runTask(arg, 'jasmine', done);
  });

  grunt.registerMultiTask('saucelabs-qunit', 'Run Qunit test cases using Sauce Labs browsers', function () {
    var done = this.async();
    var arg = this.options(defaults);

    runTask(arg, 'qunit', done);
  });

  grunt.registerMultiTask('saucelabs-yui', 'Run YUI test cases using Sauce Labs browsers', function () {
    var done = this.async();
    var arg = this.options(defaults);

    runTask(arg, 'YUI Test', done);
  });

  grunt.registerMultiTask('saucelabs-mocha', 'Run Mocha test cases using Sauce Labs browsers', function () {
    var done = this.async();
    var arg = this.options(defaults);

    runTask(arg, 'mocha', done);
  });

  grunt.registerMultiTask('saucelabs-custom', 'Run custom test cases using Sauce Labs browsers', function () {
    var done = this.async();
    var arg = this.options(defaults);

    runTask(arg, 'custom', done);
  });
};
