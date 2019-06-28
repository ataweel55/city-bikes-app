sap.ui.define(
  [
    '../services/apiService',
    'sap/ui/model/json/JSONModel',
    'jquery.sap.storage'
  ],
  function(API, JSONModel, jQuery) {
    'use strict';

    function isTimedOut(datetime) {
      const now = moment.utc();
      const end = moment.utc(datetime);
      const diff = now.diff(end, 'seconds');

      if (diff < 0) return false;

      return true;
    }

    const oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
    let trip = oStorage.get('trip') || undefined;

    if (trip && trip.pausedUntil && isTimedOut(trip.pausedUntil)) {
      trip = null;
    }

    const oModel = new JSONModel({ trip });
    oModel.setDefaultBindingMode('OneWay');

    return {
      getModel: function() {
        return oModel;
      },
      getTrip: function() {
        return oModel.getProperty('/trip');
      },
      getTrips(limit) {
        if (limit) limit = `?limit=${limit}`;
        return API._query(`users/me/trips${limit ? limit : ''}`).then(
          user => user.trips
        );
      },
      getTripById: function(id) {
        const trip = this.getTrip();
        if (trip && trip.id === parseInt(id)) return Promise.resolve(trip);
        return API.get(`trips/${id}`);
      },
      createTrip: function(bikeId) {
        return API.bookBike(bikeId).then(trip => this.setTrip(trip));
      },
      pauseTrip: function() {
        let trip = oModel.getProperty('/trip');
        if (!trip) return Promise.reject('No trip');

        return API._query(`trips/${trip.id}/command/pause`, 'POST').then(trip =>
          this.setTrip(trip)
        );
      },
      resumeTrip: function() {
        let trip = oModel.getProperty('/trip');
        if (!trip) return Promise.reject('No trip');
        return API._query(
          `trips/${trip.id}`,
          'PATCH',
          JSON.stringify({
            pausedUntil: null
          })
        ).then(trip => this.setTrip(trip));
      },
      endTrip: function(trip) {
        return API.endTrip(oModel.getProperty('/trip/id'), trip).then(
          results => {
            this._clearTrip();
            return results;
          }
        );
      },
      cancelTrip: function(id) {
        return API.cancelTrip(oModel.getProperty('/trip/id')).then(result => {
          this._clearTrip();
          return result;
        });
      },
      setTrip: function(trip) {
        oModel.setProperty('/trip', trip);
        oStorage.put('trip', trip);
        return trip;
      },
      _clearTrip: function() {
        oStorage.put('trip', null);
        oModel.setData({});
      }
    };
  }
);
