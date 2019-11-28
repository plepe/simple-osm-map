# pt-coverage-map
Interactive map that shows coverage around public transport routes. Uses offline data (includes script for downloading data).

## Installation
```sh
npm install
node get_data --help  # how to modify parameters
node get_data
```

Modify the file `get_data.txt` to load the routes you are interested in.

## Development
When developing, use the following command to automatically update the compiled JS file - with debugging information included:
```sh
npm run watch
```
