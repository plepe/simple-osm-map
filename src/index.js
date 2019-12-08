/* global L:false */

const BoundingBox = require('boundingbox')
const escapeHtml = require('escape-html')
const OverpassFrontend = require('overpass-frontend')
const OverpassLayer = require('overpass-layer')
const yaml = require('yaml')

const routeTypes = require('./routeTypes')
const httpGet = require('./httpGet')

let overpassFrontend

window.onload = function () {
  var map = L.map('map', { maxZoom: 22 })

  map.attributionControl.setPrefix('<a target="_blank" href="https://github.com/plepe/pt-coverage-map/">pt-coverage-map</a>')
  map.setView([ 48.16148, 16.31786 ], 20)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 18
  }).addTo(map)

  let file = 'data.osm'
  if (window.location.search) {
    file = window.location.search.substr(1)
  }

  httpGet('style.yaml', {}, (err, content) => {
    let style = yaml.parse(content.body)

    for (let k in style) {
      new OverpassLayer({
        overpassFrontend,
        query: k,
        minZoom: 0,
        feature: {
          style: style[k],
          markerSymbol: ''
        }
      }).addTo(map)
    }
  })

  overpassFrontend = new OverpassFrontend(file)
  global.overpassFrontend = overpassFrontend

  let markerLayer = new OverpassLayer({
    overpassFrontend,
    query: 'node[marker]',
    minZoom: 0,
    feature: {
      title: '{{ tags.marker }}',
      style: {
        nodeFeature: 'Marker'
      },
      markerSymbol: ''
    }
  })
}
