# pt-coverage-map
Interactive map that shows coverage around public transport routes. Uses offline data (includes script for downloading data).

Example: ![Screenshot](./screenshot.png)

## Installation
```sh
npm install
node get_data --help  # how to modify parameters
node get_data
npm start  # start built-in http server (of course, you can use Apache2 too)
```

Browse to http://localhost:8080

To specify a different file, use http://localhost:8080/?filename.osm

## Example style.yaml
```yaml
layers:
- query: way[highway]
  feature:
    title: Road
    style:
      color: white
      width: 5

- query: |
    (
    nwr[natural=wood];
    nwr[landuse=forest];
    )
  feature:
    style:
      fillColor: #007f00
```

## Development
When developing, use the following command to automatically update the compiled JS file - with debugging information included:
```sh
npm run watch
```
