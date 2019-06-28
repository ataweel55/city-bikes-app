sap.ui.define(
  [
    'com/sovanta/city_bikes/controller/BaseController',
    'sap/m/MessageBox',
    'sap/ui/model/json/JSONModel',
    '../services/userLocationService',
    '../services/geoService',
    '../services/mapService',
    'com/sovanta/city_bikes/model/TimeFormatter',
    'com/sovanta/city_bikes/model/DistanceFormatter',
    'com/sovanta/city_bikes/model/rides',
    'com/sovanta/city_bikes/vendor/moment/moment.min'
  ],
  function(
    BaseController,
    MessageBox,
    JSONModel,
    UserLoc,
    Geo,
    MapService,
    TimeFormatter,
    DistanceFormatter,
    RideModel
  ) {
    'use strict';

    const USER_WEIGHT = 75; //we used an average weight her
    const SPEED_CONVERSION = 0.621371;
    const SPEED_COEFFICIENT = 0.0083;
    const WEIGHT_CONVERSION = 2.20462;
    const BIKE_WEIGHT = 14.99;
    const CALORIES_COEFFICIENT = 14.4;

    return BaseController.extend('com.sovanta.city_bikes.controller.Ride', {
      formatter: TimeFormatter,
      distanceFormatter: DistanceFormatter,

      onInit: function() {
        const oModel = new JSONModel();
        oModel.setDefaultBindingMode('OneWay');

        this.setModel(oModel);
        this.setModel(RideModel.getModel(), 'ride');

        this.getRouter()
          .getRoute('ride')
          .attachPatternMatched(this._onRideIdMatched, this);

        this.setOnAfterShow(this.onAfterShow);
        this.setOnBeforeHide(this.onBeforeHide);

        this._map = this.getView().byId('vbi');
        this._map.setMapConfiguration(MapService.getConfig());
        this._map.setRefMapLayerStack('DEFAULT');
      },
      _onRideIdMatched: async function(oEvent) {
        const { rideId } = oEvent.getParameter('arguments');

        this.pauseState = 0;
        this.myTrip = [];
        this.getModel().setData({
          user: undefined,
          route: undefined,
          stats: {
            distance: 0,
            avgSpeed: 0,
            topSpeed: 0,
            timer: 0,
            caloriesBurned: 0,
            pause: undefined
          }
        });

        try {
          const trip = await RideModel.getTripById(rideId);
          RideModel.setTrip(trip);
          this.getModel('ride').refresh();
          this.onStart(trip);
        } catch (e) {
          this.showError(e);
        }
      },
      onStart: function(trip) {
        const startedAt = moment.utc(trip.created_at);
        const now = moment.utc();
        const elapsedTime = now.diff(startedAt, 'seconds');

        if (this.timer) this.stopTimer();
        if (trip.paused) this.openPauseDialog();

        this.getModel().setProperty('/stats/timer', elapsedTime);
        this.getModel().setProperty('/route', trip.route);

        this.startTimer();
      },
      onExit: function() {
        this.myTrip.length = 0;
        this.stopTimer();
        this.removeOnAfterShow(this.onAfterShow);
        this.removeOnBeforeHide(this.onBeforeHide);
      },
      onAfterShow: function() {
        this.setTitle(this.getText('titleTrip'));
        this.watchPosition();
      },
      onBeforeHide: function() {
        UserLoc.clear();
      },
      centerMap: function(lon, lat, zoom = this._map.getZoomlevel()) {
        this._map.zoomToGeoPosition(lon, lat, zoom);
      },
      returnBike: async function() {
        sap.ui.core.BusyIndicator.show();

        const route = this.myTrip;
        const lastPosition = route[route.length - 1];

        try {
          await this.addRouteMark({
            type: 'end',
            ...lastPosition
          });
          const stats = this.getModel().getProperty('/stats');
          await RideModel.endTrip(Object.assign({}, { route }, stats));
          this.myTrip.length = 0;
          this.getRouter().navTo('availableBikes');
        } catch (err) {
          this.showError(err);
        }
        sap.ui.core.BusyIndicator.hide();
      },
      onLockPressed: function() {
        MessageBox.confirm(this.getText('lockBike'), {
          title: this.getText('confirm'),
          onClose: oAction => {
            if (oAction === 'OK') this.returnBike();
          }
        });
      },
      startTimer: function() {
        const oModel = this.getModel();

        this.timer = setInterval(() => {
          const pause = oModel.getProperty('/stats/pause');
          const timer = oModel.getProperty('/stats/timer');

          if (pause && this.pauseState === 1) {
            oModel.setProperty('/stats/pause', pause - 1);
          }
          oModel.setProperty('/stats/timer', timer + 1);
        }, 1000);
      },
      stopTimer: function() {
        clearInterval(this.timer);
      },
      addRouteMark: async function({ type, lat, lon } = {}) {
        try {
          const addr = await Geo.getAddressString(lon, lat);

          if (type === 'start') {
            this.getModel().setProperty('/stats/fromAddress', addr);
            this.getModel().setProperty('/rideStart', lon + ';' + lat + ';0');
          } else if (type === 'stop') {
          } else if (type === 'end') {
            this.getModel().setProperty('/stats/toAddress', addr);
          }
        } catch (err) {
          this.showError(err);
        }
      },
      watchPosition: function(position) {
        UserLoc.watchPosition(
          async position => {
            this.getModel().setProperty('/user', position);

            const last = this.myTrip[this.myTrip.length - 1];
            const { lon, lat } = position;

            if (!last || (last.lon !== lon || last.lat !== lat)) {
              this.myTrip.push({
                lon,
                lat,
                date: Date.now(),
                state: this.pauseState
              });
              if (this.myTrip.length === 1) {
                await this.addRouteMark({ type: 'start', lat, lon });
              }
            }
            this.getModel().setProperty(
              '/route',
              Geo.convertRoute(this.myTrip)
            );

            const bikeTrip = this.myTrip.filter(part => part.state === 0) || [];
            const [avgSpeed, topSpeed] = Geo.getSpeeds(bikeTrip);
            const totalDistance = Geo.getRouteDistance(bikeTrip);
            const ridingTime = totalDistance / 1000 / avgSpeed;

            this.getModel().setProperty('/stats/distance', totalDistance);
            this.getModel().setProperty('/stats/avgSpeed', avgSpeed);
            this.getModel().setProperty('/stats/topSpeed', topSpeed);

            this.calculateCalories(avgSpeed, ridingTime);

            this.centerMap(
              this.myTrip.map(pos => pos.lon),
              this.myTrip.map(pos => pos.lat),
              this._map.getZoomlevel()
            );
          },
          err => this.showError(err)
        );
      },

      calculateCalories: function(velocity, time) {
        const speedconv = velocity * SPEED_CONVERSION;
        const speedcoef = SPEED_COEFFICIENT * speedconv * speedconv * speedconv;
        const weightconv = USER_WEIGHT * WEIGHT_CONVERSION + BIKE_WEIGHT;
        const cal = speedconv * weightconv + speedcoef;
        const caloriesperhour = cal * CALORIES_COEFFICIENT;

        let caloriesBurned = Math.round(caloriesperhour * time);

        if (isNaN(caloriesBurned)) caloriesBurned = 0;
        this.getModel().setProperty('/stats/caloriesBurned', caloriesBurned);
      },

      showError: function(err = {}) {
        MessageBox.error(err.message, {
          title: this.getText('simpleError')
        });
      },
      onPausePressed: function(ev) {
        MessageBox.confirm(this.getText('tripStartPause'), {
          title: this.getText('confirm'),
          onClose: oAction => {
            if (oAction === 'OK') this.pauseTrip();
          }
        });
      },
      pauseTrip: async function() {
        try {
          await RideModel.pauseTrip();
          this.openPauseDialog();
        } catch (e) {
          showError(e);
        }
      },
      openPauseDialog: function() {
        const trip = this.getModel('ride').getProperty('/trip');

        if (!trip || !trip.pausedUntil) return;
        if (!this._pauseDialog) {
          this._pauseDialog = sap.ui.xmlfragment(
            'com.sovanta.city_bikes.view.PauseDialog',
            this
          );
          this._pauseDialog.setEscapeHandler(oPromise => {
            this._showConfirmEndPauseDialog().then(
              () => oPromise.resolve(),
              () => oPromise.reject()
            );
          });
          this.getView().addDependent(this._pauseDialog);
        }

        const paused = moment.utc(trip.pausedUntil);
        const pauseTime = Math.abs(paused.diff(moment.utc(), 'seconds'));
        this.getModel().setProperty('/stats/pause', pauseTime);
        this.pauseState = 1;
        this._pauseDialog.open();
      },
      onCloseFragment: function() {
        this._showConfirmEndPauseDialog()
          .then(
            () => {
              return RideModel.resumeTrip().then(() => {
                this._pauseDialog.close();
                this.pauseState = 0;
              });
            },
            () => {}
          )
          .catch(e => this.showError(e));
      },
      _showConfirmEndPauseDialog: function() {
        return new Promise((resolve, reject) => {
          this.confirmEscapePreventDialog = new sap.m.Dialog({
            title: this.getText('tripConfirmPauseEnd'),
            type: 'Message',
            content: new sap.m.Text({
              text: this.getText('tripConfirmUnlockBike')
            }),
            endButton: new sap.m.Button({
              text: this.getText('tripUnlockBike'),
              press: () => {
                this.confirmEscapePreventDialog.close();
                this.confirmEscapePreventDialog.destroy();
                resolve();
              }
            }),
            beginButton: new sap.m.Button({
              text: this.getText('genericno'),
              press: () => {
                this.confirmEscapePreventDialog.close();
                this.confirmEscapePreventDialog.destroy();
                reject();
              }
            })
          });
          this.confirmEscapePreventDialog.open();
        });
      }
    });
  }
);
