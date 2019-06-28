sap.ui.define([], function() {
  'use strict';

  return {
    getConfig: function() {
      return {
        MapProvider: [
          {
            name: 'Openstreetmap',
            copyright:
              "<b><a href='http://www.openstreetmap.org/copyright'>© openstreetmap</a></b>",
            Source: [
              {
                id: 's1',
                url: 'https://a.tile.openstreetmap.org/{LOD}/{X}/{Y}.png'
              },
              {
                id: 's2',
                url: 'https://b.tile.openstreetmap.org/{LOD}/{X}/{Y}.png'
              },
              {
                id: 's3',
                url: 'https://c.tile.openstreetmap.org/{LOD}/{X}/{Y}.png'
              }
            ]
          }
        ],
        MapLayerStacks: [
          {
            name: 'DEFAULT',
            MapLayer: {
              name: 'layer1',
              refMapProvider: 'Openstreetmap',
              colBkgnd: 'RGB(255,255,255)'
            }
          }
        ]
      };
    }
  };
});
