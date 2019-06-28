sap.ui.define(
  [
    'com/sovanta/city_bikes/controller/BaseController',
    'sap/ui/model/json/JSONModel',
    'sap/m/MessageToast',
    '../services/authService',
    '../model/user',
    '../model/rides',
    '../services/apiService',
    'sap/m/MessageBox',
    'com/sovanta/city_bikes/model/rides'
  ],
  function(
    BaseController,
    JSONModel,
    MessageToast,
    AuthService,
    UserModel,
    RidesModel,
    API,
    MessageBox,
    RideModel
  ) {
    'use strict';

    return BaseController.extend('com.sovanta.city_bikes.controller.App', {
      data: {
        title: 'Sovanta Bikes',
        navigation: [
          {
            icon: 'sap-icon://fa/bike',
            key: 'availableBikes'
          },
          {
            icon: 'sap-icon://fa/bike',
            key: 'ride'
          },
          {
            icon: 'sap-icon://activity-items',
            key: 'statistics'
          },
          {
            icon: 'sap-icon://customer-history',
            key: 'historyOverview'
          }
        ]
      },
      onInit: function() {
        this.toolPage = this.getElementById('toolPage');

        this.setModel(new JSONModel(this.data));
        this.setModel(UserModel.getModel(), 'user');

        this.getEventBus().subscribe(
          'app',
          'showToast',
          this.onShowToast,
          this
        );
        this.getEventBus().subscribe(
          'app',
          'changeTitle',
          this.onChangeTitle,
          this
        );

        this.getRouter().attachRouteMatched(oEvent =>
          this._onRouteChanged(oEvent)
        );
      },
      onBeforeRendering: function() {
        this.getModel().setProperty(
          '/navigation/0/title',
          this.getText('availableBikes')
        );
        this.getModel().setProperty(
          '/navigation/1/title',
          this.getText('trip')
        );
        this.getModel().setProperty(
          '/navigation/2/title',
          this.getText('myStatistics')
        );
        this.getModel().setProperty(
          '/navigation/3/title',
          this.getText('myHistory')
        );
      },
      onSideNavButtonPress: function() {
        this.toolPage.toggleSideContentMode();
      },
      onUserNamePress: function(oEvent) {
        var oButton = oEvent.getSource();

        if (!this._actionSheet) {
          this._actionSheet = sap.ui.xmlfragment(
            'com.sovanta.city_bikes.view.UserMenu',
            this
          );
          this.getView().addDependent(this._actionSheet);
        }

        this._actionSheet.openBy(oButton);
      },
      onLogoutPress: function(oEvent) {
        if (RideModel.getTrip()) {
          MessageBox.error(this.getText('endTripFirst'), {
            title: 'Error'
          });
          return;
        }
        AuthService.logout().then(() => {
          const oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
          oStorage.clear();
          MessageToast.show(this.getText('logoutSuccess'));
          UserModel.clear();
          this.getRouter().navTo('login');
        });
      },
      onReport: function(oEvent) {
        const trip = RidesModel.getTrip();
        this.getRouter().navTo('report', {
          selectedBikeId: trip.bikeId
        });
      },
      onItemSelect: function(oEvent) {
        var oItem = oEvent.getParameter('item');
        var sKey = oItem.getKey();
        var router = this.getRouter();

        if (sKey === 'ride') {
          const trip = RidesModel.getTrip();
          router.navTo('ride', {
            rideId: trip.id
          });
        } else {
          router.navTo(sKey);
        }
        this.toolPage.setSideExpanded(false);
      },
      onShowToast: function(sChannel, sEvent, oData) {
        if (sEvent === 'showToast') sap.m.MessageToast.show(oData.message);
      },
      onChangeTitle: function(sChannel, sEvent, oData) {
        if (sEvent === 'changeTitle')
          this.getModel().setProperty('/title', oData.title);
      },
      _onRouteChanged: function(oEvent) {
        const route = oEvent.getParameter('name');
        const trip = RidesModel.getTrip();
        const oModel = this.getModel();

        oModel.getProperty('/navigation').forEach(el => (el.visible = true));

        if (trip) {
          this.getModel().setProperty('/activeTrip', true);
          oModel
            .getProperty('/navigation')
            .find(el => el.key === 'availableBikes').visible = false;
        } else {
          this.getModel().setProperty('/activeTrip', false);
          oModel
            .getProperty('/navigation')
            .find(el => el.key === 'ride').visible = false;
        }

        oModel.refresh();
      }
    });
  }
);
