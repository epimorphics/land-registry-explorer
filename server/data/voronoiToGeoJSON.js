'use strict';

const fs = require('fs')
const d3voronoi = require('d3-voronoi')
const fc = require('./featureCollection')
const poly = require('./polygon')
const JSONStream = require('JSONStream');

var postcodes = {
  "type": "FeatureCollection",
  "features": []
}

var i = 0;
var null_count = 0;

var in_stream = JSONStream.parse(['features', true ]) //rows, ANYTHING, doc 

in_stream.on('data', function(data) {
  if(data.geometry != null) {
    postcodes.features.push(data)
  } else {
    null_count = null_count + 1
  }
  if (i % 10000 == 0) {
    console.log(i);
  }
  i = i + 1;
});

in_stream.on('end', function(data) {
  console.log(`Done parsing!`)
  console.log(`There were ${null_count} features without a geometry!`)
  voronoiFromPoints()
})

in_stream.on('header', function (data) {
  fs_write_stream.write(`{"type":"FeatureCollection","features":[\n`);
})

var fs_read_stream = fs.createReadStream('./postcode_test.json').pipe(in_stream);
var fs_write_stream = fs.createWriteStream('./postcode_test_voronoi.json');

function voronoiFromPoints() {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  // console.log(postcodes.features.length)
  postcodes.features.forEach(feature => {
    let c = feature.geometry.coordinates;
    if ( c[0] < minX ) {
      minX = c[0]
    }
    if ( c[0] > maxX ) {
      maxX = c[0]
    }
    if ( c[1] < minY ) {
      minY = c[1]
    }
    if ( c[1] > maxY ) {
      maxY = c[1]
    }
  });
  console.log(minX, minY, maxX, maxY);

  let postcodePoints = postcodes.features.map(feature => {
    return feature.geometry.coordinates
  })

  let voronoi = d3voronoi.voronoi().extent([[minX, minY], [maxX, maxY]])
  let polygons = voronoi(postcodePoints).polygons()

  polygons.forEach(p => {
    // Create a new feature object.
    let feature = JSON.parse(JSON.stringify(poly))
    // Reverse coordinate order so it conforms to the right-hand rule.
    // Close the ring by making the last position the same as the first.
    p.reverse().push(p[0])
    feature.geometry.coordinates.push(p)
    fc.features.push(feature)
    fs_write_stream.write(JSON.stringify(feature));
    fs_write_stream.write(",\n");
  })

  fs_write_stream.write("]}")
  fs_write_stream.end();

  console.log("Finished writing to an output file!")
}
