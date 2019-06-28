sap.ui.define(
  [
    'com/sovanta/city_bikes/controller/BaseController',
    'sap/ui/model/json/JSONModel',
    '../services/apiService',
    'com/sovanta/city_bikes/model/DistanceFormatter',
    'com/sovanta/city_bikes/model/TimeFormatter',
    'com/sovanta/city_bikes/model/rides',
    'sap/m/MessageBox',
    'com/sovanta/city_bikes/model/StatisticsFormatter'
  ],
  function(
    BaseController,
    JSONModel,
    ServerAPI,
    DistanceFormatter,
    TimeFormatter,
    RideModel,
    MessageBox,
    StatisticsFormatter
  ) {
    'use strict';

    return BaseController.extend(
      'com.sovanta.city_bikes.controller.Statistics',
      {
        distanceFormatter: DistanceFormatter,
        timeFormatter: TimeFormatter,
        statisticsFormatter: StatisticsFormatter,
        onInit: function() {
          const oModel = new JSONModel({
            isLoading: true
          });
          oModel.setDefaultBindingMode('OneWay');
          this.setModel(oModel);
          this.setOnAfterShow(this.onAfterShow);
        },
        onAfterShow: async function() {
          this.setTitle(this.getText('titleStatistics'));
          try {
            this.getModel().setProperty('/trips', null);
            this.getModel().setProperty('/stats', null);
            this.getModel().setProperty('/isLoading', true);

            sap.ui.core.BusyIndicator.show();
            const [stats, trips] = await Promise.all([
              ServerAPI.getStats(),
              RideModel.getTrips(5)
            ]);
            if (trips.length > 0) {
              let lastTrips = {
                distances: [],
                durations: [],
                avgSpeeds: [],
                topSpeeds: [],
                calories: []
              };
              trips.forEach((trip, i) => {
                lastTrips.distances.unshift({ x: i, y: trip.distance || 0 });
                lastTrips.durations.unshift({ x: i, y: trip.duration || 0 });
                lastTrips.avgSpeeds.unshift({ x: i, y: trip.avgSpeed || 0 });
                lastTrips.topSpeeds.unshift({ x: i, y: trip.topSpeed || 0 });
                lastTrips.calories.unshift({
                  x: i,
                  y: trip.caloriesBurned || 0
                });
              });
              this.getModel().setProperty('/trips', lastTrips);
            }
            if (stats[0].avgSpeed) {
              stats[0].avgSpeed = stats[0].avgSpeed.toFixed(2);
              this.getModel().setProperty('/stats', stats[0]);
            }
          } catch (err) {
            this.showError(err);
          } finally {
            this.getModel().setProperty('/isLoading', false);
            sap.ui.core.BusyIndicator.hide();
          }
        },
        onExit: function() {
          this.removeOnAfterShow(this.onAfterShow);
        },
        showError: function(err = {}) {
          MessageBox.error(err.message, {
            title: this.getText('simpleError')
          });
        }
      }
    );
  }
);
