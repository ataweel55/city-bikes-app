sap.ui.define([], function() {
  'use strict';

  return {
    _watchId: null,
    lastPosition: null,
    watchPosition: function(onSuccess, onError) {
      if (!navigator.geolocation) return onError();
      if (this._watchId) return onError();

      this._watchId = navigator.geolocation.watchPosition(
        position => {
          this.storePosition(position);
          onSuccess(this.lastPosition);
        },
        onError,
        {
          enableHighAccuracy: true
        }
      );
    },
    getPosition: function() {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject();
        if (this.lastPosition) return resolve(this.lastPosition);

        navigator.geolocation.getCurrentPosition(
          position => {
            this.storePosition(position);
            resolve(this.lastPosition);
          },
          error => reject(error)
        );
      });
    },
    storePosition: function(position) {
      this.lastPosition = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
    },
    clear: function() {
      if (this._watchId) {
        navigator.geolocation.clearWatch(this._watchId);
        this.lastPosition = null;
        this._watchId = null;
      }
    }
  };
});
