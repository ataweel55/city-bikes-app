sap.ui.define(['sap/ui/test/Opa5'], function(Opa5) {
  'use strict';

  return Opa5.extend('com.sovanta.city_bikes.test.integration.pages.Common', {
    iStartTheApp: function() {
      this.iStartMyUIComponent({
        componentConfig: {
          name: 'com.sovanta.city_bikes',
          async: true
        }
      });
    },

    iTeardownTheApp: function() {
      this.iTeardownMyUIComponent();
    }
  });
});
