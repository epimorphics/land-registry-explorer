'use strict';

const fs = require('fs')
const d3voronoi = require('d3-voronoi')
const fc = require('./featureCollection')
const poly = require('./polygon')

let postcodes = 'postcode_test.json'
fs.readFile(postcodes, 'utf8', (err, data) => {
  if ( err ) {
    return console.error(err)
  }
  let geojson = JSON.parse(data)
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  geojson.features.forEach(feature => {
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

  let neighborhoodPoints = geojson.features.map(feature => {
    return feature.geometry.coordinates
  })
  let voronoi = d3voronoi.voronoi().extent([[minX, minY], [maxX, maxY]])
  let polygons = voronoi(neighborhoodPoints).polygons()

  polygons.forEach(p => {
    // Create a new feature object.
    let feature = JSON.parse(JSON.stringify(poly))
    // Reverse coordinate order so it conforms to the right-hand rule.
    // Close the ring by making the last position the same as the first.
    p.reverse().push(p[0])
    feature.geometry.coordinates.push(p)
    fc.features.push(feature)
  })

  let out = 'postcode_test_voronoi.json'
  fs.writeFile(out, JSON.stringify(fc, null, 2), (err) => {
    if ( err ) {
      return console.error(err)
    }
    console.log(`Finished and wrote ${out}`)
  })
})
