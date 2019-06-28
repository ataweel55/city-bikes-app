sap.ui.define([], function() {
  'use strict';
  return {
    distanceToBike: function(dist) {
      if (dist > 999) return dist / 1000;
      return dist;
    },
    distanceUnit: function(dist) {
      if (dist > 999) return 'km';
      return 'm';
    }
  };
});
