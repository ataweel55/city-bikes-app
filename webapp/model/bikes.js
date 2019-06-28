sap.ui.define(
  [
    '../services/iotService',
    '../services/apiService',
    'sap/ui/model/json/JSONModel',
    'jquery.sap.storage',
    'com/sovanta/city_bikes/vendor/moment/moment.min'
  ],
  function(iotAPI, serverAPI, JSONModel, jQuery) {
    'use strict';

    function isValid(reservation) {
      const now = moment.utc();
      const end = moment.utc(reservation.endsAt);

      if (now.diff(end) >= 0) {
        oStorage.remove('reservation');
        return false;
      }

      return true;
    }

    const oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
    let reservation = oStorage.get('reservation');

    // Check if reservation is still valid, otherwise dump
    if (reservation && !isValid(reservation)) {
      reservation = null;
    }

    const selectedBike = reservation ? reservation.bikeId : null;
    const oModel = new JSONModel({
      bikes: [],
      reservation,
      selectedBike
    });
    oModel.setDefaultBindingMode('OneWay');

    const map = {
      gps_lat: 'lat',
      gps_long: 'lon'
    };

    let bikesIndex = {};

    return {
      getModel: function() {
        return oModel;
      },
      loadBikes: function() {
        return iotAPI.get('devices').then(bikes => {
          bikes.forEach((bike, i) => {
            bikesIndex[bike.id] = i;
            bike.visible = true;
            bike.measures = {
              lat: 0,
              lon: 0
            };
          });

          oModel.setProperty('/bikes', bikes);
          return bikes;
        });
      },
      getBike: async function(bikeId) {
        let bike = oModel.getProperty(`/bikes/${bikesIndex[bikeId]}`);
        if (bike) return Promise.resolve(bike);

        bike = await iotAPI.get(`devices/${bikeId}`);
        bike.measures = await this.getMeasures(bikeId);
        return bike;
      },
      getAllMeasures: function() {
        return Promise.all([
          ...oModel.getProperty('/bikes').map(bike =>
            this.getMeasures(bike.id).then(measures => {
              bike.measures = measures;
            })
          ),
          this.getStatus()
        ]);
      },
      getMeasures: function(bikeId) {
        return iotAPI
          .get(`devices/${bikeId}/measures?skip=0&top=1&orderby=timestamp desc`)
          .then(results => {
            const measures = {};

            results.forEach(({ measure }) => {
              for (let key in measure) {
                const _key = map[key] || key;
                measures[_key] = measure[key];
              }
            });

            return measures;
          });
      },
      getStatus: function() {
        return serverAPI.getBikes().then(results => {
          return results.forEach(bike => {
            oModel.setProperty(
              `/bikes/${bikesIndex[bike.id]}`,
              Object.assign(
                oModel.getProperty(`/bikes/${bikesIndex[bike.id]}`),
                {
                  reserved: bike.reserved,
                  functional: bike.functional,
                  booked: bike.booked
                }
              )
            );
          });
        });
      },
      hideBikesExcept: function(bikeId) {
        oModel
          .getProperty('/bikes')
          .filter(bike => bike.id !== bikeId)
          .forEach(bike => (bike.visible = false));
      },
      reserveBike: function(bikeId) {
        return serverAPI.reserveBike(bikeId).then(reservation => {
          const bikes = oModel.getProperty('/bikes');

          this.hideBikesExcept(bikeId);

          bikes[bikesIndex[bikeId]].reserved = true;

          oModel.setProperty('/reservation', reservation);
          oModel.setProperty('/reservation/bike', bikes[bikesIndex[bikeId]]);
          oStorage.put('reservation', reservation);

          return reservation;
        });
      },
      reportBike: async function(bikeId, options) {
        const [bike, report] = await serverAPI.reportProblem(bikeId, options);
        if (this.getReservation() && this.getReservation().bikeId === bike.id)
          this.clearReservation();
      },
      getReservation: function() {
        const reservation = oModel.getProperty('/reservation');
        return reservation && isValid(reservation) ? reservation : null;
      },
      clearReservation: function() {
        oModel.setProperty('/reservation', null);
        oStorage.remove('reservation');
      },
      selectBike: function(bike) {
        oModel.setProperty('/selectedBike', bike);
      },
      deselectBike: function() {
        oModel.setProperty('/selectedBike', null);
        oModel.getProperty('/bikes').forEach(bike => {
          bike.selected = false;
        });
        oModel.refresh();
      },
      getSelectedBike: function() {
        return oModel.getProperty('/selectedBike');
      }
    };
  }
);
