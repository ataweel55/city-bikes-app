sap.ui.define([], function() {
  'use strict';
  return {
    formatterH: function(t) {
      if (!t) return '00';
      var v = Math.floor(t / 60 / 60);
      return v < 10 ? '0' + v : v;
    },
    formatterM: function(t) {
      if (!t) return '00';
      var v = Math.floor(t / 60) % 60;
      return v < 10 ? '0' + v : v;
    },
    formatterS: function(t) {
      if (!t) return '00';
      var v = t % 60;
      return v < 10 ? '0' + v : v;
    },
    formatStatsH: function(t) {
      if (!t) return '0';
      var v = Math.floor(t / 60 / 60);
      return v;
    },
    formatStatsM: function(t) {
      if (!t) return '0';
      var v = Math.floor(t / 60) % 60;
      return v;
    }
  };
});
