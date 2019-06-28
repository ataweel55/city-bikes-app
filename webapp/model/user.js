sap.ui.define(['sap/ui/model/json/JSONModel'], function(JSONModel, Auth) {
  'use strict';

  let oModel = new JSONModel();
  oModel.setDefaultBindingMode('OneWay');

  return {
    getModel: function() {
      return oModel;
    },
    setUser: function(user) {
      oModel.setData(user);
    },
    hasUser: function() {
      return Object.keys(oModel.getProperty('/')).length > 0;
    },
    clear: function() {
      oModel.setData({});
    }
  };
});
