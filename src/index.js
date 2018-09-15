const boundingbox = require('boundingbox')
const async = {
  each: require('async/each'),
  eachLimit: require('async/eachLimit')
}

const httpGet = require('./httpGet')

const routeTypes = {
  'tram': {
    color: '#ff0000'
  },
  'bus': {
    color: '#0000ff'
  }
}

window.onload = function () {
  var map = L.map('map')

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

  let routeLayer = L.featureGroup()
  map.addLayer(routeLayer)

  let stopLayer = L.featureGroup()
  map.addLayer(stopLayer)

  let routes = []
  let elements = {}
  let coverageData = {}

  let file = 'data'
  if (location.search) {
    file = location.search.substr(1)
  }

  httpGet(file + '.json', {}, (err, result) => {
    if (err) {
      console.log(err)
      return alert("Can't download geojson file " + file + '.json')
    }

    result = JSON.parse(result.body)

    async.eachLimit(result.elements, 32,
      (element, done) => {
        let id = element.type + '/' + element.id
        elements[id] = element

        if (element.type === 'relation' && element.tags && element.tags.type === 'route') {
          routes.push(element)
        }

        done()
      },
      (err) => {
        async.eachLimit(routes, 4,
          (route, done) => {
            async.each(route.members,
              (member, done) => {
                let memberId = member.type + '/' + member.ref
                let element = elements[memberId]

                if (!element) {
                  console.log("Can't find element " + memberId)
                  return done()
                }

                if (!element.routes) {
                  element.routes = []
                }
                element.routes.push(route)

                if (member.role === 'stop') {
                  if (!(memberId in coverageData)) {
                    coverageData[memberId] = [ element.lat, element.lon ]
                  }
                }

                if (member.role === '' && member.type === 'way') {
                  let way = L.polyline(element.geometry.map((geom => [ geom.lat, geom.lon ])),
                  {
                    weight: 1.5,
                    color: route.tags.route in routeTypes ? routeTypes[route.tags.route].color : '#000000'
                  })
                  routeLayer.addLayer(way)
                }

                if (member.role === 'stop' && member.type === 'node') {
                  let way = L.circleMarker([ element.lat, element.lon ],
                  {
                    radius: 4,
                    weight: 0,
                    fillColor: route.tags.route in routeTypes ? routeTypes[route.tags.route].color : '#000000',
                    fillOpacity: 1
                  })
                  stopLayer.addLayer(way)

                  way.bindPopup(element.routes.map(route => route.tags.name).join('<br>'))
                }

                done()
              },
              (err) => {
                done(err)
              }
            )
          },
          (err) => {
            let data = Object.values(coverageData)
            coverageLayer1.setData(data)
            coverageLayer2.setData(data)

            let bounds = new BoundingBox(data[0])
            data.slice(1).forEach(
              (value) => {
                bounds.extend(value)
              }
            )

            map.fitBounds(bounds.toLeaflet())
          }
        )
      }
    )
  })
}
