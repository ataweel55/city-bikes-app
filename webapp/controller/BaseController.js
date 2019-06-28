sap.ui.define(['sap/ui/core/mvc/Controller'], function(Controller) {
  'use strict';

  return Controller.extend('com.sovanta.city_bikes.controller.BaseController', {
    setTitle: function(title) {
      this.getEventBus().publish('app', 'changeTitle', { title });
    },

    getElementById: function(sId) {
      return sap.ui.getCore().byId(this.getView().getId() + '--' + sId);
    },

    getRouter: function() {
      return sap.ui.core.UIComponent.getRouterFor(this);
    },

    getModel: function(sName) {
      return this.getView().getModel(sName);
    },

    getEventBus: function() {
      return sap.ui.getCore().getEventBus();
    },

    setModel: function(oModel, sName) {
      return this.getView().setModel(oModel, sName);
    },

    getText: function(key, params) {
      var oBundle = this.getView()
        .getModel('i18n')
        .getResourceBundle();
      return oBundle.getText(key, params);
    },

    setEventDelegate: function(delegate) {
      this.getView().addEventDelegate(delegate, this);
    },

    setOnAfterShow: function(handler) {
      this.setEventDelegate({
        onAfterShow: handler
      });
    },

    setOnBeforeHide: function(handler) {
      this.setEventDelegate({
        onBeforeHide: handler
      });
    },

    removeOnBeforeHide: function(handler) {
      this.getView().removeEventDelegate({
        onBeforeHide: handler
      });
    },

    removeOnAfterShow: function(handler) {
      this.getView().removeEventDelegate({
        onAfterShow: handler
      });
    },

    showToast: function(message) {
      this.getEventBus().publish('app', 'showToast', { message });
    }
  });
});
