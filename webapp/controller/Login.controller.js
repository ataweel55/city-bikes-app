sap.ui.define(
  [
    'com/sovanta/city_bikes/controller/BaseController',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    'sap/m/MessageBox',
    '../services/authService',
    'sap/ui/model/resource/ResourceModel'
  ],
  function(BaseController, JSONModel, MessageToast, MessageBox, Auth) {
    'use strict';

    return BaseController.extend('com.sovanta.city_bikes.controller.Login', {
      onInit: function() {
        this.setModel(
          new JSONModel({
            credentials: {},
            submitted: false
          })
        );
        this.setOnAfterShow(this.onAfterShow);
      },
      onAfterShow: function() {
        this.setTitle(this.getText('titleLogin'));
      },
      onExit: function() {
        this.removeOnAfterShow(this.onAfterShow);
      },
      onLoginPress: function() {
        sap.ui.core.BusyIndicator.show(0);
        this.getModel().setProperty('/submitted', true);

        var cred = this.getModel().getData().credentials;

        Auth.loginRequest(cred.email, cred.password).then(
          user => {
            MessageToast.show(this.getText('loginSuccess'), {
              onClose: () => {
                sap.ui.core.BusyIndicator.hide();
                this.getRouter().navTo('availableBikes');
                this.setModel(new JSONModel({ credentials: {} }));
              }
            });
          },
          error => {
            sap.ui.core.BusyIndicator.hide();
            this.getModel().setProperty('/submitted', false);
            MessageBox.error(this.getText('loginFailed'), {
              title: this.getText('simpleError')
            });
          }
        );
      }
    });
  }
);
