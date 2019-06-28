sap.ui.define([], function() {
  'use strict';
  return {
    bikeTypeFormatter: function(bike) {
      if (!bike.functional || bike.booked)
        return sap.ui.vbm.SemanticType.Hidden;
      if (bike.reserved) return sap.ui.vbm.SemanticType.Inactive;
      if (bike.selected) return sap.ui.vbm.SemanticType.Success;
      return sap.ui.vbm.SemanticType.Default;
    }
  };
});
