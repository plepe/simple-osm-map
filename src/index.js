const boundingbox = require('boundingbox')
const async = {
  each: require('async/each'),
  eachLimit: require('async/eachLimit')
}
const escapeHtml = require('escape-html')
const OverpassFrontend = require('overpass-frontend')
const OverpassLayer = require('overpass-layer')

const httpGet = require('./httpGet')
const convertFromXML = require('./convertFromXML')

const routeTypes = {
  'tram': {
    color: '#ff0000'
  },
  'bus': {
    color: '#0000ff'
  },
  'default': {
    color: '#000000'
  }
}

global.overpassFrontend

window.onload = function () {
  var map = L.map('map').setView([ 48, 16 ], 4)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  let coverageLayer1 = L.TileLayer.maskCanvas({
    radius: 600,
    useAbsoluteRadius: true,
    opacity: 0.3
  })
  map.addLayer(coverageLayer1)

  let coverageLayer2 = L.TileLayer.maskCanvas({
    radius: 300,
    useAbsoluteRadius: true,
    opacity: 0.2
  })
  map.addLayer(coverageLayer2)

  let markerLayer = L.featureGroup()
  map.addLayer(markerLayer)

  let routeLayer = L.featureGroup()
  map.addLayer(routeLayer)

  let stopLayer = L.featureGroup()
  map.addLayer(stopLayer)

  let coverageData = {}

  let file = 'data.osm'
  if (location.search) {
    file = location.search.substr(1)
  }

  overpassFrontend = new OverpassFrontend(file)

  overpassLayer = new OverpassLayer({
    overpassFrontend,
    query: 'relation[route]',
    minZoom: 0,
    members: true,
    feature: {
      markerSymbol: '',
      styles: [],
    },
    memberFeature: {
      pre: function (el) {
        el._routeType = routeTypes.default
        if (el.masters.length) {
          let type = el.masters[0].tags.route
          if (type in routeTypes) {
            el._routeType = routeTypes[type]
          }
        }
      },
      title: '<b>{{ tags.name }}</b>',
      body: (el) => {
        if (el.masters) {
          return el.masters.map(route => escapeHtml(route.tags.name)).join('<br>')
        }
      },
      style: function (el) {
        if (el.type === 'node') {
          return {
            nodeFeature: 'CircleMarker',
            radius: 4,
            width: 0,
            fillColor: el._routeType.color,
            fillOpacity: 1
          }
        } else {
          return {
            width: 1.5,
            color: el._routeType.color
          }
        }
      }
    }
  })

  overpassLayer.addTo(map)

  let bounds
  overpassFrontend.BBoxQuery(
    'relation[type=route]',
    { minlon: -180, maxlon: 180, minlat: -90, maxlat: 90 },
    {
    },
    (err, route) => {
      if (bounds) {
        bounds.extend(route.bounds)
      } else {
        bounds = new BoundingBox(route.bounds)
      }
    },
    (err) => {
      if (bounds) {
        map.fitBounds(bounds.toLeaflet())
      }
    }
  )
}
