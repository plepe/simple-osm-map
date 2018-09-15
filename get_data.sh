#!/bin/sh
wget -O data.json --post-file=get_data.txt "https://overpass-api.de/api/interpreter"
