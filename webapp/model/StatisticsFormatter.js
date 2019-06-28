sap.ui.define([], function() {
  'use strict';
  return {
    returnFirstElement: function(array) {
      if (array && array[0]) return array[0].y;
    },
    returnLastElement: function(array) {
      if (array && array[array.length - 1]) return array[array.length - 1].y;
    }
  };
});
