sap.ui.define(
  [
    'sap/ui/core/UIComponent',
    './services/authService',
    './model/bikes',
    './model/rides',
    'sap/ui/core/IconPool'
  ],
  function(UIComponent, AuthService, BikesModel, RidesModel, IconPool) {
    'use strict';
    return UIComponent.extend('com.sovanta.city_bikes.Component', {
      metadata: {
        manifest: 'json'
      },
      init: function() {
        UIComponent.prototype.init.apply(this, arguments);

        IconPool.addIcon('bike', 'fa', {
          fontFamily: 'FontAwesome',
          content: 'f206'
        });

        IconPool.addIcon('startFlag', 'fa', {
          fontFamily: 'FontAwesome',
          content: 'f11e'
        });

        IconPool.addIcon('fire', 'fa', {
          fontFamily: 'FontAwesome',
          content: 'f06d'
        });

        IconPool.addIcon('tacho', 'fa', {
          fontFamily: 'FontAwesome',
          content: 'f0e4'
        });

        IconPool.addIcon('problem', 'fa', {
          fontFamily: 'FontAwesome',
          content: 'f0ad'
        });

        const oRouter = this.getRouter();

        oRouter.attachRouteMatched(function(oEvent) {
          const route = oEvent.getParameter('name');
          const trip = RidesModel.getTrip();

          if (!AuthService.isAuthorized()) {
            if (route !== 'login') {
              return oRouter.navTo('login');
            }
          }

          if (route === 'index') {
            if (trip) {
              return oRouter.navTo('ride', {
                rideId: trip.id
              });
            }

            oRouter.navTo('availableBikes');
          }

          if (route === 'availableBikes') {
            if (trip) {
              return oRouter.navTo('ride', {
                rideId: trip.id
              });
            }
          }
        });

        oRouter.initialize();
      }
    });
  }
);
