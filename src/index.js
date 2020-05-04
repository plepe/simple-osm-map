/* global L:false */

const BoundingBox = require('boundingbox')
const escapeHtml = require('escape-html')
const OverpassFrontend = require('overpass-frontend')
const OverpassLayer = require('overpass-layer')
const yaml = require('yaml')
const queryString = require('query-string')
const hash = require('sheet-router/hash')

const routeTypes = require('./routeTypes.json')
const httpGet = require('./httpGet')

let overpassFrontend
let map

function hashApply (loc) {
  console.log(loc)
  let state = queryString.parse(loc)

  if ('map' in state) {
    let parts = state.map.split('/')
    state.zoom = parts[0]
    state.lat = parts[1]
    state.lon = parts[2]

    if (typeof map.getZoom() === 'undefined') {
      map.setView({ lat: state.lat, lng: state.lon }, state.zoom)
    } else {
      map.flyTo({ lat: state.lat, lng: state.lon }, state.zoom)
    }
  }
}

window.onload = function () {
  map = L.map('map', { maxZoom: 22 })

  map.attributionControl.setPrefix('<a target="_blank" href="https://github.com/plepe/pt-coverage-map/">pt-coverage-map</a>')

  let overpass = '//overpass-api.de/api/interpreter'
  let options = {}
  if (window.location.search) {
    options = queryString.parse(window.location.search)
  }

  if (options.data) {
    overpass = 'data/' + options.data
  }

  overpassFrontend = new OverpassFrontend(overpass)
  if (options.data) {
    overpassFrontend.on('load', (meta) => {
      if (meta.bounds && typeof map.getZoom() === 'undefined') {
        map.fitBounds(meta.bounds.toLeaflet())
      }
    })
  }

  hash(loc => {
    hashApply(loc.substr(1))
  })
  if (location.hash) {
    hashApply(location.hash)
  }

  map.on('moveend', () => {
    let center = map.getCenter().wrap()
    let zoom = parseFloat(map.getZoom()).toFixed(0)

    var locPrecision = 5
    if (zoom) {
      locPrecision =
        zoom > 16 ? 5
        : zoom > 8 ? 4
        : zoom > 4 ? 3
        : zoom > 2 ? 2
        : zoom > 1 ? 1
        : 0
    }

    link = 'map=' +
      zoom + '/' +
      center.lat.toFixed(locPrecision) + '/' +
      center.lng.toFixed(locPrecision)

    history.replaceState(null, null, '#' + link)
  })

  if (!options.style) {
    options.style = 'style.yaml'
  }

  httpGet('data/' + options.style, {}, (err, content) => {
    let style = yaml.parse(content.body)

    if (style.tileLayers && style.tileLayers.length === 1) {
      let layer = style.tileLayers[0]
      L.tileLayer(layer.url, layer).addTo(map)
    } else if (style.tileLayers && style.tileLayers.length > 1) {
      let layers = {}
      style.tileLayers.forEach((layer, i) => {
        let l = L.tileLayer(layer.url, layer)
        layers[layer.title || ('Layer #' + i)] = l
        if (i === 0) {
          l.addTo(map)
        }
      })
      L.control.layers(layers).addTo(map)
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
      }).addTo(map)
    }

    if (!style.layers) {
      style.layers = []
    }

    style.layers.forEach(def => {
      if (!def.feature) {
        def.feature = {}
      }

      if (!('markerSymbol' in def.feature)) {
        def.feature.markerSymbol = ''
      }

      if (!('title' in def.feature)) {
        def.feature.title = '{{ tags.name }}'
      }

      if (!('body' in def.feature)) {
        def.feature.body = '{{ tags.description }}'
      }

      new OverpassLayer({
        overpassFrontend,
        query: def.query,
        minZoom: 0,
        feature: def.feature
      }).addTo(map)
    })
  })
}
