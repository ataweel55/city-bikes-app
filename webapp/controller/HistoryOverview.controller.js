sap.ui.define(
  [
    'com/sovanta/city_bikes/controller/BaseController',
    'sap/ui/model/json/JSONModel',
    'com/sovanta/city_bikes/model/rides',
    '../services/geoService',
    'sap/m/MessageBox',
    'com/sovanta/city_bikes/model/DistanceFormatter'
  ],
  function(
    BaseController,
    JSONModel,
    RideModel,
    Geo,
    MessageBox,
    DistanceFormatter
  ) {
    'use strict';

    return BaseController.extend(
      'com.sovanta.city_bikes.controller.HistoryOverview',
      {
        distanceFormatter: DistanceFormatter,
        onInit: async function() {
          const oModel = new JSONModel({
            isLoading: true
          });
          oModel.setDefaultBindingMode('OneWay');
          this.setModel(oModel);
          this.setOnAfterShow(this.onAfterShow);
          this.setOnBeforeHide(this.onBeforeHide);
        },
        onExit: function() {
          this.removeOnAfterShow(this.onAfterShow);
        },
        onAfterShow: async function() {
          this.setTitle(this.getText('titleHistory'));
          try {
            sap.ui.core.BusyIndicator.show();
            let trips = await RideModel.getTrips();
            trips = trips.filter(trip => trip.returned);
            trips = trips.filter(trip => trip.route && trip.route.length > 0);
            if (trips.length === 0) trips = null;
            this.getModel().setProperty('/trips', trips);
          } catch (e) {
            this.showError(e);
          } finally {
            this.getModel().setProperty('/isLoading', false);
            sap.ui.core.BusyIndicator.hide();
          }
        },

        onListItemPress: function(evt) {
          this.getRouter().navTo('historyDetail', {
            tripId: evt
              .getSource()
              .getAttributes()[0]
              .getText()
          });
        },
        showError: function(err = {}) {
          let message = err.message;
          MessageBox.error(message, {
            title: 'Error'
          });
        }
      }
    );
  }
);
