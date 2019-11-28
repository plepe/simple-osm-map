const ArgumentParser = require('argparse').ArgumentParser
const request = require('request')
const fs = require('fs')

const parser = new ArgumentParser({
  addHelp: true,
  description: 'Loads specified routes from OpenStreetMap Overpass API and saves them to a .osm file'
})

parser.addArgument(
  [ '-f', '--file' ],
  {
    help: 'File to write data to (default: data.osm)',
    defaultValue: 'data.osm'
  }
)
parser.addArgument(
  [ '-b', '--bbox' ],
  {
    help: 'Load all public transport routes which cross the specified bounding box (lat,lon,lat,lon)'
  }
)
parser.addArgument(
  [ 'id' ],
  {
    help: 'Load routes with the specified relation IDs',
    nargs: '*'
  }
)

let args = parser.parseArgs()

let query = '[out:xml];('

if (args.bbox) {
  query += 'relation[route~"^(train|subway|monorail|tram|trolleybus|bus|aerialway|ferry)$"](' + args.bbox + ');'
}
if (args.id) {
  query += args.id
    .map(id => 'relation(' + id + ');')
    .join('')
}
if (!args.id.length && !args.bbox) {
  query += 'relation[route~"^(subway)$"](48.14,16.28,48.28,16.44);'
}

query += ');out meta;>;out meta;'

request(
  {
    method: 'POST',
    url: 'https://overpass-api.de/api/interpreter',
    body: query
  },
  (err, httpReq, body) => {
    fs.writeFileSync(args.file, body)
  }
)
