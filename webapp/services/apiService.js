sap.ui.define(['jquery.sap.storage'], function(jQuery) {
  'use strict';

  const _baseUrl =
    'https://city-bikes-server.cfapps.eu10.hana.ondemand.com/api';
  const oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);

  return {
    _query: function(endpoint, method = 'GET', body, headers = {}) {
      headers['accept'] = 'application/json';
      headers['Content-Type'] = 'application/json';

      if (oStorage.get('token'))
        headers['Authorization'] = `Bearer ${oStorage.get('token')}`;

      return fetch(`${_baseUrl}/${endpoint}`, {
        method,
        headers,
        body
      }).then(
        response => {
          return response.json().then(json => {
            return response.ok ? json : Promise.reject(json);
            // if 401 --> oStorage.remove('token');
          });
        },
        err => {
          Promise.reject(err);
        }
      );
    },
    auth: function(username, password) {
      const body = JSON.stringify({
        username,
        password
      });

      return this._query('auth', 'POST', body);
    },
    getUser: function(id = 'me') {
      return this._query(`users/${id}`, 'GET');
    },
    get: function(endpoint) {
      return this._query(endpoint);
    },
    getBikes: function() {
      return this._query('bikes');
    },
    getStats: function(id = 'me') {
      return this._query(`users/${id}/statistics`);
    },
    reserveBike: function(bikeId) {
      return this._query(`bikes/${bikeId}/reservations`, 'POST');
    },
    bookBike: function(id) {
      return this._query(`bikes/${id}/trips`, 'POST');
    },
    endTrip: function(id, trip) {
      return Promise.all([
        this._query(`trips/${id}/command/stop`, 'POST'),
        this._query(`trips/${id}`, 'PATCH', JSON.stringify(trip))
      ]);
    },
    cancelTrip: function(id) {
      return this._query(`trips/${id}/command/stop`, 'POST');
    },
    reportProblem: function(id, { problems, description } = {}) {
      return Promise.all([
        this._query(
          `bikes/${id}/`,
          'PATCH',
          JSON.stringify({ functional: false })
        ),
        this._query(
          `reports`,
          'POST',
          JSON.stringify({
            bikeId: parseInt(id),
            problems,
            description
          })
        )
      ]);
    }
  };
});
