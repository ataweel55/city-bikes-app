sap.ui.define([], function() {
  'use strict';

  // const _baseUrl = 'https://sovanta1.eu10.cp.iot.sap/iot/core/api/v1';
  // const _baseUrl = 'http://localhost:3000/api/iot'; // mock iot cockpit api
  const _baseUrl =
    'https://city-bikes-server.cfapps.eu10.hana.ondemand.com/api/iot';

  const queryApi = function(method, endpoint, body, headers = {}) {
    headers['Authorization'] = 'Basic dGVhbV9wcm9qZWN0OkdhZTNvYmVl';
    headers['accept'] = 'application/json';

    let config = {
      headers: headers,
      method: method,
      body: body
    };

    return fetch(`${_baseUrl}/${endpoint}`, config).then(
      response => {
        return response.json().then(json => {
          return response.ok ? json : Promise.reject(json);
        });
      },
      err => Promise.reject(err)
    );
  };

  return {
    get: function(endpoint, skip = 0, top = 10) {
      return queryApi('GET', endpoint);
    }
  };
});
