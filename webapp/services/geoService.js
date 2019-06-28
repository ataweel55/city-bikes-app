sap.ui.define(['com/sovanta/city_bikes/vendor/geolib/geolib.min'], function() {
  const speed = 5000;
  var topSpeed = 0;
  return {
    getDistance: function(from, to) {
      let distance = geolib.getDistance(
        { latitude: from.lat, longitude: from.lon },
        { latitude: to.lat, longitude: to.lon }
      );

      return {
        distance: distance,
        time: Math.round(distance / speed * 60)
      };
    },
    getBounds: function(pos) {
      let bounds = geolib.getBounds(
        pos.map(({ lat, lon }) => ({ latitude: lat, longitude: lon }))
      );

      bounds = [
        {
          lat: bounds.minLat,
          lon: bounds.minLng
        },
        {
          lat: bounds.maxLat,
          lon: bounds.maxLng
        }
      ];

      return bounds;
    },
    getCenter: function(bikeLocations) {
      let center = geolib.getCenter(bikeLocations);
      return center;
    },
    getSpeeds: function(posdata) {
      if (posdata.length < 2) return [0, 0];
      let counter = 0,
        speedsum = 0;
      let parts = posdata.map(pos => ({
        lat: pos.lat,
        lng: pos.lon,
        time: pos.date,
        paused: pos.state === 1
      }));

      for (let i = 1; i < parts.length; i++) {
        if (parts[i - 1].paused || parts[i].paused) continue; // skip over pauses
        let currentSpeed = geolib.getSpeed(parts[i - 1], parts[i]);
        speedsum += currentSpeed;
        counter++;
        if (currentSpeed > topSpeed) topSpeed = currentSpeed;
      }
      return [(speedsum / counter).toFixed(2), topSpeed.toFixed(2)];
    },
    getRouteDistance: function(posdata) {
      if (posdata.length < 2) return 0;
      let totalDistance = 0;
      let parts = posdata.map(pos => ({
        lat: pos.lat,
        lon: pos.lon
      }));
      for (let i = 1; i < parts.length; i++) {
        totalDistance += this.getDistance(parts[i - 1], parts[i]).distance;
      }
      return totalDistance;
    },

    getAddressObject: function(lon, lat) {
      return fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      ).then(
        response => {
          return response.json().then(json => {
            return response.ok ? json : Promise.reject(json);
          });
        },
        err => Promise.reject(err)
      );
    },
    getAddressString: function(lon, lat) {
      return this.getAddressObject(lon, lat).then(address => {
        if (!address.address.road) return Promise.reject();
        if (!address.address.house_number) return address.address.road;
        return address.address.road + ' ' + address.address.house_number;
      });
    },
    getRoute: function(from, to) {
      var directionsService = new google.maps.DirectionsService();
      return new Promise((resolve, reject) => {
        directionsService.route(
          {
            origin: new google.maps.LatLng(from.lat, from.lon),
            destination: new google.maps.LatLng(to.lat, to.lon),
            travelMode: 'WALKING'
          },
          (response, status) => {
            if (!status || status !== 'OK') return reject();
            let coords = response.routes[0].overview_path.map(
              ({ lat, lng }) => {
                return { lon: lng(), lat: lat() };
              }
            );
            resolve({
              distance: response.routes[0].legs[0].distance.value,
              duration: response.routes[0].legs[0].duration.value,
              position: this.convertRoute(coords)
            });
          }
        );
      });
    },
    convertRoute: function(route) {
      return route.map(pos => `${pos.lon};${pos.lat};0`).join(';');
    }
  };
});
