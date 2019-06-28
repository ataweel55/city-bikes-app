sap.ui.define([], function() {
  'use strict';
  return {
    enableReserve: function(bike, locErr) {
      if (locErr || !bike || bike.reserved) return false;
      return true;
    },
    enableRent: function(bike, locErr) {
      if (locErr || !bike) return false;
      if (bike.rentable) return true;
      return false;
    }
  };
});
