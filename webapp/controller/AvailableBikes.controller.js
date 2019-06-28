sap.ui.define(
  [
    'com/sovanta/city_bikes/controller/BaseController',
    'sap/m/MessageBox',
    '../model/bikes',
    '../services/userLocationService',
    'sap/ui/model/json/JSONModel',
    '../services/geoService',
    '../services/mapService',
    'com/sovanta/city_bikes/model/BikeTypeFormatter',
    'com/sovanta/city_bikes/model/ActionButtonFormatter',
    'com/sovanta/city_bikes/model/rides',
    'com/sovanta/city_bikes/model/DistanceFormatter',
    'com/sovanta/city_bikes/model/TimeFormatter',
    'com/sovanta/city_bikes/vendor/moment/moment.min'
  ],
  function(
    Controller,
    MessageBox,
    BikeModel,
    UserLoc,
    JSONModel,
    Geo,
    MapService,
    BikeTypeFormatter,
    ActionButtonFormatter,
    RideModel,
    DistanceFormatter,
    TimeFormatter
  ) {
    'use strict';

    const DISABLE_DISTANCE_CHECK = true;
    const UNLOCK_DISTANCE = 20;

    return Controller.extend(
      'com.sovanta.city_bikes.controller.AvailableBikes',
      {
        formatter: BikeTypeFormatter,
        distanceFormatter: DistanceFormatter,
        actionButtonFormatter: ActionButtonFormatter,
        timeFormatter: TimeFormatter,
        _map: undefined,
        _bikeMarkers: {},
        onInit: function() {
          const oModel = new JSONModel({
            selectedAddress: undefined,
            user: undefined,
            locErr: true,
            route: undefined,
            reminderTimer: undefined
          });
          oModel.setDefaultBindingMode('OneWay');
          this.setModel(BikeModel.getModel());
          this.setModel(oModel, 'positions');
          this.setOnAfterShow(this.onAfterShow);
          this.setOnBeforeHide(this.onBeforeHide);

          this._map = this.getView().byId('vbi');
          this._map.setMapConfiguration(MapService.getConfig());
          this._map.setRefMapLayerStack('DEFAULT');
        },
        onAfterShow: async function() {
          this.setTitle(this.getText('titleOverview'));
          try {
            sap.ui.core.BusyIndicator.show();
            await BikeModel.loadBikes();
            await this.initMeasures();
            await this.updateBikes();
          } catch (e) {
            this.showError(e);
          } finally {
            sap.ui.core.BusyIndicator.hide();
          }
        },
        onBeforeHide: function() {
          if (this._updateBikesTimeout) {
            clearTimeout(this._updateBikesTimeout);
            this._updateBikesTimeout = null;
          }
          UserLoc.clear();
        },
        onExit: function() {
          UserLoc.clear();
          this.removeOnBeforeHide(this.onBeforeHide);
          this.removeOnAfterShow(this.onAfterShow);
        },

        getUserPosition: function() {
          return UserLoc.getPosition().then(position => {
            this.getModel('positions').setProperty('/user', position);
            return position;
          });
        },

        initMeasures: function() {
          return Promise.all([BikeModel.getAllMeasures()]).then(() => {
            this.getModel().refresh();

            //Centers the map in the center of the bikes and the user
            const positions = {
              lat: [],
              lon: []
            };

            this.getModel()
              .getProperty('/bikes')
              .forEach(bike => {
                positions.lat.push(bike.measures.lat);
                positions.lon.push(bike.measures.lon);
              });

            this.centerMap(positions.lon, positions.lat);

            // recenter the map once the user is loaded
            this.getUserPosition().then(user => {
              this.watchPosition();
              this.centerMap(
                [...positions.lon, ...(user ? [user.lon] : [])],
                [...positions.lat, ...(user ? [user.lat] : [])]
              );
            });

            const cluster = new sap.ui.vbm.Cluster({
              type: 'Default',
              icon: 'sap-icon://fa/bike'
            });

            cluster.addStyleClass('fa-icon');

            if (!this.oCurrentClustering) {
              this.oCurrentClustering = new sap.ui.vbm.ClusterDistance({
                click: this.onClusterClicked.bind(this),
                vizTemplate: cluster,
                rule: 'unselected=1',
                distance: 128
              });
            }

            // Workaround: Using single marker cluster to
            // prevent bike pointers to overlap the user
            // position indicator
            if (!this.oUserClustering) {
              this.oUserClustering = new sap.ui.vbm.ClusterDistance({
                rule: 'status=user',
                vizTemplate: new sap.ui.vbm.Cluster()
              });
            }

            this._map.addCluster(this.oCurrentClustering);
            this._map.addCluster(this.oUserClustering);

            const reservation = BikeModel.getReservation();
            if (reservation) this.restoreReservation(reservation);
          });
        },

        restoreReservation: async function(reservation) {
          const bike = await BikeModel.getBike(reservation.bikeId);
          BikeModel.hideBikesExcept(bike.id);

          this.startReminder(reservation.endsAt);
          this.showBikeDetails(bike);
        },

        updateBikes: function() {
          this._updateBikesTimeout = setTimeout(() => {
            BikeModel.getAllMeasures().then(() => {
              this.getModel().refresh();
              if (this._updateBikesTimeout) this.updateBikes();
            });
          }, 10000);
        },
        getAvailability: async function(bikePath, userLoc) {
          let bike = await this.getModel().getProperty(bikePath);
          if (
            Geo.getDistance(bike.measures, userLoc).distance <=
              UNLOCK_DISTANCE ||
            DISABLE_DISTANCE_CHECK
          )
            this.getModel().setProperty(`${bikePath}/rentable`, true);
          else this.getModel().setProperty(`${bikePath}/rentable`, false);
          this.getModel().refresh(true);
        },
        watchPosition: function() {
          UserLoc.watchPosition(
            async position => {
              this.getModel('positions').setProperty('/locErr', false);
              this.getModel('positions').setProperty('/user', position);
              let reservation = BikeModel.getReservation();
              let selectedBike = BikeModel.getSelectedBike();
              if (reservation) {
                this.centerMap(position.lon, position.lat);
                this.getAvailability('/reservation/bike', position);
              } else if (selectedBike) {
                this.getAvailability('/selectedBike', position);
              }
            },
            err => {
              this.getModel('positions').setProperty('/locErr', true);
              this.showError(err);
            }
          );
        },
        showError: function(err = {}) {
          let message = err.message;
          if (err.code && err.code === err.PERMISSION_DENIED)
            message = this.getText('userLocError');

          MessageBox.error(message, {
            title: this.getText('simpleError')
          });
        },
        centerMap: function(lon, lat, zoom) {
          if (!zoom) zoom = this._map.getZoomlevel();
          this._map.zoomToGeoPosition(lon, lat, zoom);
        },
        onBikePressed: function(event, a) {
          const binding = event
            .getSource()
            .getBindingContext()
            .getPath();

          const bike = this.getModel().getProperty(binding);

          this.showBikeDetails(bike);
        },
        showBikeDetails: async function(bike) {
          bike.selected = 1;
          BikeModel.selectBike(bike);
          const user = await this.getUserPosition();
          this.getAvailability('/selectedBike', user);
          const { lat, lon } = bike.measures;

          this.centerMap([user.lon, lon], [user.lat, lat]);
          this._map.attachClick(this.hideBikeDetails, this);

          try {
            const route = await Geo.getRoute(
              { lat, lon },
              {
                lat: user.lat,
                lon: user.lon
              }
            );
            this.getModel('positions').setProperty('/route', route);

            const address = await Geo.getAddressString(lon, lat);
            this.getModel('positions').setProperty('/selectedAddress', address);
          } catch (e) {}
        },
        hideBikeDetails: function() {
          this._map.detachClick(this.hideBikeDetails, this);
          BikeModel.deselectBike();

          this.getModel().setProperty('/selectedBike', undefined);
          this.getModel('positions').setProperty('/selectedAddress', undefined);
        },
        onLocateMePressed: async function() {
          const user = await this.getUserPosition();
          this.centerMap(user.lon, user.lat);
        },
        onClusterClicked: function(event) {
          var clusterContainer = event.getParameter('instance');
          var oTargetCluster = clusterContainer.getItem();
          var type = sap.ui.vbm.ClusterInfoType.ContainedVOs;
          var allSpots = this._map.getClusteredSpots(clusterContainer, type);
          var oClusterModel = new sap.ui.model.json.JSONModel();

          const { lat, lon } = this.getModel('positions').getProperty('/user');

          const spots = allSpots
            .filter(spot => {
              const bike = this.getModel().getProperty(
                spot.getBindingContext().sPath
              );
              return !bike.reserved;
            })
            .map(spot => {
              const spotPosition = spot.getPosition().split(';');
              return {
                distance: Geo.getDistance(
                  { lat, lon },
                  {
                    lon: spotPosition[0],
                    lat: spotPosition[1]
                  }
                ).distance,
                name: spot.getTooltip(),
                binding: spot.getBindingContext().getPath()
              };
            });

          oClusterModel.setData({
            spots: spots.sort((a, b) => a.distance - b.distance)
          });

          let oItemList = new sap.m.List({
            items: {
              path: '/spots',
              template: new sap.m.ObjectListItem({
                title: '{name}',
                type: 'Active',
                icon: 'sap-icon://fa/bike',
                number: 'ca. {distance}',
                numberUnit: 'm'
              })
            }
          });

          let oBikeClusterPopover = new sap.m.ResponsivePopover({
            title: this.getText('bikes'),
            placement: sap.m.PlacementType.HorizontalPreferredRight,
            content: oItemList
          });

          oItemList.attachItemPress(event => {
            let sPath = event
              .getParameter('listItem')
              .getBindingContext()
              .getPath();

            this.showBikeDetails(
              this.getModel().getProperty(
                oClusterModel.getProperty(sPath).binding
              )
            );
            oBikeClusterPopover.close();
          });

          oBikeClusterPopover.setModel(oClusterModel);
          oBikeClusterPopover.openBy(oTargetCluster);
        },
        onReservePressed: async function() {
          let selectedBike = BikeModel.getSelectedBike();
          if (!selectedBike) return;
          let reservedId = selectedBike.id;
          try {
            sap.ui.core.BusyIndicator.show();
            const reservation = await BikeModel.reserveBike(reservedId);
            const bike = await BikeModel.getBike(reservedId);
            const user = await this.getUserPosition();

            this.startReminder(reservation.endsAt);
            this.centerMap(
              [user.lon, bike.measures.lon],
              [user.lat, bike.measures.lat]
            );
          } catch (err) {
            this.hideBikeDetails();
            this.showError(err);
          } finally {
            sap.ui.core.BusyIndicator.hide();
          }
        },
        startReminder: function(endsAt) {
          const start = moment.utc(endsAt);
          const now = moment.utc();
          const diff = Math.abs(now.diff(start, 'seconds'));
          this.getModel().setProperty('/reminderTimer', diff);

          const oModel = this.getModel();
          this.reminderTimer = setInterval(() => {
            if (oModel.getProperty('/reminderTimer') <= 0) {
              this.showToast(this.getText('reservedTimeOver'));
              BikeModel.clearReservation();
              if (this.reminderTimer) clearInterval(this.reminderTimer);
            }
            oModel.setProperty(
              '/reminderTimer',
              oModel.getProperty('/reminderTimer') - 1
            );
          }, 1000);
        },
        onBookPressed: async function(oEvent) {
          sap.ui.core.BusyIndicator.show();
          const bikeId = oEvent.getSource().data('bikeId');

          BikeModel.deselectBike();
          try {
            const ride = await RideModel.createTrip(bikeId);
            this.showToast(this.getText('rentBikeSuccess'));
            this.hideBikeDetails();
            if (BikeModel.getReservation()) BikeModel.clearReservation();
            this.getRouter().navTo('ride', {
              rideId: ride.id
            });
          } catch (err) {
            this.showError(err);
          } finally {
            sap.ui.core.BusyIndicator.hide();
          }
        },
        onReportPressed: function(event) {
          const bikeId = event.getSource().data('bikeId');

          this.hideBikeDetails();
          this.getRouter().navTo('report', {
            selectedBikeId: bikeId
          });
        }
      }
    );
  }
);
