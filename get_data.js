const request = require('request')
const fs = require('fs')

const query = fs.readFileSync('get_data.txt')

request(
  {
    method: 'POST',
    url: 'https://overpass-api.de/api/interpreter',
    body: query
  },
  (err, httpReq, body) => {
    fs.writeFileSync('data.osm', body)
  }
)
