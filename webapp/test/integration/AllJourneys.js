sap.ui.define(
  [
    'sap/ui/test/Opa5',
    'com/sovanta/city_bikes/test/integration/pages/Common',
    'com/sovanta/city_bikes/test/integration/TodoListJourney',
    'com/sovanta/city_bikes/test/integration/SearchJourney',
    'com/sovanta/city_bikes/test/integration/FilterJourney'
  ],
  function(Opa5, Common) {
    'use strict';

    Opa5.extendConfig({
      arrangements: new Common(),
      pollingInterval: 1
    });
  }
);
