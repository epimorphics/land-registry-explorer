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

db.collection("postcodes").drop();

const geoJSONFeatureSchema = Schema({
  type: { type: String },
  geometry: {
      type: { type: String },
      coordinates: { type: Array }
  },
  properties: {
      clipped: { type: String }
  }
});

const postcode = mongoose.model('postcode', geoJSONFeatureSchema);

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var i = 0;

db.once('open', function() {
  var in_stream = JSONStream.parse(['features', true ]) 
  
  in_stream.on('data', function(data) {
    // console.log(data)
    var feature = new postcode;
    feature.type = data.type
    feature.properties.clipped = data.properties._clipped

    if(data.geometry.type === "GeometryCollection") {
      feature.geometry.type = data.geometry.geometries[0].type
      feature.geometry.coordinates.push.apply(feature.geometry.coordinates, data.geometry.geometries[0].coordinates)
    } else {
      feature.geometry.type = data.geometry.type
      feature.geometry.coordinates.push.apply(feature.geometry.coordinates, data.geometry.coordinates)
    }

    postcode.create(feature, (err, doc) => {
      if (err){ 
        console.log(`Failed to add a new feature to the database! \n${feature}`)
        process.exit();        
      }
    })

    if (i % 10000 == 0) {
      console.log(i);
    }

    i = i + 1;
  });
  
  in_stream.on('end', function(data) {
    db.collection("postcodes").createIndex({
      geometry: "2dsphere"
    })
    console.log(`Done populating the database!`)
    process.exit();        
  })
  
  var fs_read_stream = fs.createReadStream('./clipped_postcode.json').pipe(in_stream);

});

