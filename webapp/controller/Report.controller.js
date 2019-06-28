sap.ui.define(
  [
    'com/sovanta/city_bikes/controller/BaseController',
    'sap/m/MessageBox',
    'com/sovanta/city_bikes/model/bikes',
    'com/sovanta/city_bikes/model/rides',
    'sap/ui/model/json/JSONModel'
  ],
  function(Controller, MessageBox, BikeModel, RideModel, JSONModel) {
    'use strict';

    var ListController = Controller.extend(
      'com.sovanta.city_bikes.controller.Report',
      {
        onInit: function() {
          this.setModel(new JSONModel({ problems: [] }));
          this.getRouter()
            .getRoute('report')
            .attachPatternMatched(this._getBikeId, this);
          this.setOnAfterShow(this.onAfterShow);
        },
        _getBikeId: function(oEvent) {
          const { selectedBikeId } = oEvent.getParameter('arguments');
          this.getModel().setProperty('/bikeId', selectedBikeId);
          this.getModel().refresh();
        },
        onAfterRendering: function() {
          const data = [
            {
              Name: this.getText('reportingProblem1'),
              id: 'flat'
            },
            {
              Name: this.getText('reportingProblem2'),
              id: 'light'
            },
            {
              Name: this.getText('reportingProblem3'),
              id: 'locking'
            },
            {
              Name: this.getText('reportingProblem4'),
              id: 'unlocking'
            },
            {
              Name: this.getText('reportingProblem5'),
              id: 'padock'
            }
          ];
          this.getModel().setProperty('/problems', data);
        },
        onAfterShow: function() {
          this.setTitle(this.getText('titleReport'));
        },
        onExit: function() {
          this.removeOnAfterShow(this.onAfterShow);
        },
        reset: function() {
          this.getModel()
            .getProperty('/problems')
            .forEach(problem => (problem.selected = false));
          this.getModel().setProperty('/reportDescription', '');
        },
        cancelReport: function() {
          let problemModel = this.getModel().getProperty('/problems');

          // If the description is not empty or something is selected
          if (
            this.getModel().getProperty('/reportDescription') ||
            problemModel.some(problem => problem.selected)
          ) {
            return MessageBox.show(this.getText('reportingCancelWarning'), {
              title: this.getText('confirm'),
              actions: [
                sap.m.MessageBox.Action.YES,
                sap.m.MessageBox.Action.NO
              ],
              onClose: oAction => {
                if (oAction == 'YES') {
                  this.reset();
                  window.history.go(-1);
                }
              }
            });
          }
          window.history.go(-1);
        },
        sendReport: async function() {
          const problemModel = this.getModel().getProperty('/problems');
          const problemDescription = this.getModel().getProperty(
            '/reportDescription'
          );

          //There is a problem selected or described
          if (
            problemDescription ||
            problemModel.some(problem => problem.selected)
          ) {
            const report = {
              problems: problemModel
                .filter(problem => problem.selected)
                .map(problem => problem.id),
              description: problemDescription
            };

            try {
              sap.ui.core.BusyIndicator.show();
              await BikeModel.reportBike(
                this.getModel().getProperty('/bikeId'),
                report
              );
              this.showToast(this.getText('reportSuccess'));
              if (RideModel.getTrip()) {
                const { id } = RideModel.getTrip();
                await RideModel.cancelTrip(id);
              }
              this.reset();
              this.getRouter().navTo('availableBikes');
            } catch (err) {
              this.showError(err);
            } finally {
              sap.ui.core.BusyIndicator.hide();
            }
          } else {
            //There is no problem selected neither described
            return MessageBox.show(this.getText('reportingSendWarning'), {
              title: this.getText('confirm')
            });
          }
        },
        showError: function(err = {}) {
          let message = err.message;
          MessageBox.error(message, {
            title: this.getText('simpleError')
          });
        }
      }
    );
    return ListController;
  }
);
