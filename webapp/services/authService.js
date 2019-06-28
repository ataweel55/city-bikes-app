sap.ui.define(
  [
    'jquery.sap.storage',
    'sap/ui/model/json/JSONModel',
    '../model/user',
    '../services/apiService'
  ],
  function(jQuery, JSONModel, UserModel, API) {
    'use strict';

    const oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local);
    const _baseUrl = 'http://localhost:3000';

    if (oStorage.get('token') && oStorage.get('user')) {
      UserModel.setUser(oStorage.get('user'));
    }

    return {
      isAuthorized: () => (oStorage.get('token') ? true : false),
      loginRequest: function(username, password) {
        return API.auth(username, password)
          .then(response => oStorage.put('token', response.token))
          .then(() => API.getUser('me'))
          .then(user => {
            oStorage.put('user', user);
            UserModel.setUser(user);
            return user;
          });
      },
      logout: function() {
        return new Promise((resolve, reject) => {
          try {
            oStorage.remove('token');
            oStorage.remove('user');
            UserModel.getModel().setData({});
            resolve();
          } catch (err) {
            reject(err);
          }
        });
      }
    };
  }
);
