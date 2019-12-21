/* global L:false */

const BoundingBox = require('boundingbox')
const escapeHtml = require('escape-html')
const OverpassFrontend = require('overpass-frontend')
const OverpassLayer = require('overpass-layer')
const yaml = require('yaml')
const queryString = require('query-string')

const routeTypes = require('./routeTypes')
const httpGet = require('./httpGet')

let overpassFrontend

window.onload = function () {
  var map = L.map('map', { maxZoom: 22 })

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
      if (meta.bounds) {
        map.fitBounds(meta.bounds.toLeaflet())
      }
    })
  }

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
