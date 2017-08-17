'use strict';

const fs = require('fs');

const JSONStream = require('JSONStream');

const mongodb = require('mongodb');

const ObjectId = require('mongodb').ObjectID;

const mongoose = require('mongoose');

const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/local', {
    useMongoClient: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var i = 0;

db.once('open', function() {

  var in_stream = JSONStream.parse(['features', true ]) 
  
  in_stream.on('data', function(data) {
    if( data.geometry != null ) {
      let centroid = []
      centroid.push(data.geometry.coordinates[0])
      centroid.push(data.geometry.coordinates[1])
      const postcode = data.properties.pcd
      db.collection("postcodes").update(
        { 
          geometry: { 
            $geoIntersects: { 
              $geometry: { 
                type: "Point", 
                coordinates: [centroid[0], centroid[1]]
              }
            }
          },
          "properties.postcode": {
            $exists: false
          }
        },
        {
          $set: { 
            "properties.postcode": postcode,
            "properties.centroid": centroid 
          }
        }
      )
      i = i + 1;
      if (i % 1000 == 0) {
        console.log(i);
      }
    }
  });
  
  in_stream.on('end', function(data) {
    console.log(`Done updating the database!`)
    process.exit()
  })
  
  var fs_read_stream = fs.createReadStream('./postcode_simple.json').pipe(in_stream);

});

