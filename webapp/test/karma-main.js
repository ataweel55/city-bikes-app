(function(karma) {
  'use strict';

  // Prevent Karma from running prematurely.
  karma.loaded = function() {};

  sap.ui.getCore().attachInit(function() {
    sap.ui.require(
      [
        'com/sovanta/city_bikes/test/unit/allTests'
        // 'com/sovanta/city_bikes/test/integration/AllJourneys'
      ],
      function() {
        // Finally, start Karma to run the tests.
        karma.start();
      }
    );
  });
})(window.__karma__);
