// Unit tests run with Jasmine and Karma. `ng test` opens Chrome; `npm run test:ci` runs once, headless.
module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
    ],
    client: { jasmine: { random: false }, clearContext: false },
    jasmineHtmlReporter: { suppressAll: true },
    reporters: ['progress', 'kjhtml'],
    browsers: ['Chrome'],
    customLaunchers: { ChromeHeadlessCI: { base: 'ChromeHeadless', flags: ['--no-sandbox'] } },
    restartOnFileChange: true,
  });
};
