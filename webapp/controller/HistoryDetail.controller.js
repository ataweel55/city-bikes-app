sap.ui.define(
  [
    'com/sovanta/city_bikes/controller/BaseController',
    'sap/ui/model/json/JSONModel',
    'com/sovanta/city_bikes/services/mapService',
    'com/sovanta/city_bikes/services/geoService',
    'com/sovanta/city_bikes/model/rides',
    'sap/m/MessageBox',
    'com/sovanta/city_bikes/model/TimeFormatter',
    'com/sovanta/city_bikes/model/DistanceFormatter'
  ],
  function(
    BaseController,
    JSONModel,
    MapService,
    GeoService,
    RideModel,
    MessageBox,
    TimeFormatter,
    DistanceFormatter
  ) {
    'use strict';

    return BaseController.extend(
      'com.sovanta.city_bikes.controller.HistoryDetail',
      {
        timeFormatter: TimeFormatter,
        distanceFormatter: DistanceFormatter,
        onInit: async function() {
          const oModel = new JSONModel({
            trip: undefined,
            route: {
              start: undefined,
              positions: undefined
            }
          });
          oModel.setDefaultBindingMode('OneWay');
          this.setModel(oModel);

          this.getRouter()
            .getRoute('historyDetail')
            .attachPatternMatched(this._onTripIdMatched, this);

          this._map = this.getView().byId('vbi');
          this._map.setMapConfiguration(MapService.getConfig());
          this._map.setRefMapLayerStack('DEFAULT');
        },
        _onTripIdMatched: async function(oEvent) {
          const { tripId } = oEvent.getParameter('arguments');
          try {
            sap.ui.core.BusyIndicator.show();
            const trip = await RideModel.getTripById(tripId);
            this.setTitle(`${this.getText('titleHistoryDetails')} ${tripId}`);
            this.getModel().setProperty('/trip/', trip);

            if (!trip.route || trip.route.length < 1) return;

            this.getModel().setProperty('/route/', {
              start: GeoService.convertRoute([trip.route[0]]),
              positions: GeoService.convertRoute(trip.route),
              destination: GeoService.convertRoute([
                trip.route[trip.route.length - 1]
              ])
            });

            const bounds = GeoService.getBounds(trip.route);

            this._map.zoomToGeoPosition(
              bounds.map(pos => pos.lon),
              bounds.map(pos => pos.lat),
              10
            );
          } catch (e) {
            this.showError(e);
          } finally {
            sap.ui.core.BusyIndicator.hide();
          }
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
