<template>
  <div id="app">
    <div>
      <md-input-container>
        <label>Postcode</label>
        <md-input v-model="selectedPostcode"></md-input>
      </md-input-container>
    </div>
    <GoogleMap ref="gmap" 
               v-on:emitMapCenter="readMapCenter" 
               :mapCenter="mapCenter" ></GoogleMap>
    <md-bottom-bar @change="changeVisualization">
      <md-bottom-bar-item md-icon-src="assets/icon-home.svg">Map</md-bottom-bar-item>
      <md-bottom-bar-item md-icon-src="assets/icon-home.svg" md-active>Bar</md-bottom-bar-item>
      <md-bottom-bar-item md-icon-src="assets/icon-home.svg">Pie</md-bottom-bar-item>
    </md-bottom-bar>
  </div>
</template>

<script>
  import GoogleMap from '@/components/GoogleMap'

  const axios = require('axios')
  const Promise = require('bluebird')
  const turf = require('@turf/turf')

  export default {
    name: 'app',
    data () {
      return {
        currentViz: 'map',
        selectedPostcode: '',
        visiblePostcodes: [],
        mapCenter: new window.google.maps.LatLng(51.46040383078197, -2.6015971891367826)
      }
    },
    computed () {
      return {
        selectedPostcode: this.selectedPostcode,
        mapCenter: this.mapCenter
      }
    },
    components: {
      GoogleMap
    },
    methods: {
      updateCenter: function () {
        const url = `https://api.postcodes.io/postcodes/${this.selectedPostcode}`
        console.log(`Centroid URL: ${url}`)
        axios.get(url).then((response) => {
          const latitude = response.data.result.latitude
          const longitude = response.data.result.longitude
          this.mapCenter = new window.google.maps.LatLng(latitude, longitude)
          console.log(`updateCenter: ${JSON.stringify(this.mapCenter)}`)
        }).then(() => {
          this.getNearbyPostcodes()
        }).catch((error) => {
          console.log(`Error: ${error}`)
        })
      },
      updateVisiblePostcodes: function (newVisiblePostcodes) {
        this.visiblePostcodes = newVisiblePostcodes
        this.getData()
      },
      getNearbyPostcodes: function () {
        this.visiblePostcodes = []
        const url = `https://api.postcodes.io/postcodes?lon=${this.mapCenter.lng()}&lat=${this.mapCenter.lat()}&radius=300&limit=99`
        console.log(`Nearby URL: ${url}`)
        axios.get(url).then((response) => {
          const results = response.data.result
          results.forEach((result) => {
            var postcode = turf.point([result.longitude, result.latitude])
            postcode.id = result.postcode
            this.visiblePostcodes.push(postcode)
          })
          // console.log(`getNearbyPostcodes: ${JSON.stringify(this.visiblePostcodes)}`)
        }).then(() => {
          this.populateURLs()
        }).catch((error) => {
          console.log(`Error: ${error}`)
        })
      },
      populateURLs: function () {
        this.visiblePostcodes.forEach((postcode) => {
          var url = `http://landregistry.data.gov.uk/data/ppi/transaction-record.json?_page=0&propertyAddress.postcode=${postcode.id}&_pageSize=50`
          url = url.replace(` `, `%20`)
          postcode.properties.url = url
        })
        this.getData()
      },
      getData: function () {
        Promise.map(this.visiblePostcodes, postcode => axios.get(postcode.properties.url).then((response) => {
          var totalPaid = 0
          const data = response.data.result.items
          data.forEach((transaction) => {
            totalPaid += transaction.pricePaid
          })
          if (totalPaid === 0) {
            postcode.properties.averagePaid = 0
          } else {
            postcode.properties.averagePaid = totalPaid / data.length
          }
        }).catch((error) => {
          console.log(error)
        }), { concurrency: 10 }).then(() => {
          // console.log(`getData: ${JSON.stringify(this.visiblePostcodes)}`)
          this.$refs.gmap.generateVoronoi(this.visiblePostcodes)
        })
      },
      readMapCenter: function (newMapCenter) {
        console.log(`App got new map center: ${newMapCenter}`)
        this.mapCenter = newMapCenter
        this.getNearbyPostcodes()
      },
      changeVisualization: function (event) {
        console.log(event)
      }
    },
    watch: {
      selectedPostcode: function (newPostcode) {
        if (newPostcode.length === 7) {
          this.updateCenter()
        }
      }
    }
  }
</script>

<style>
@import "../node_modules/vue-material/dist/vue-material.css";
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: auto;
  margin-top: 60px;
  width: 450px;
  height: 380px;
  box-shadow: 1px 2px 2px 0px rgba(0,0,0,0.11);
}

h1, h2 {
  font-weight: normal;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}

.md-bottom-bar {
  box-shadow: 0px 0px 0px 0px rgba(0,0,0,0);
}

.postcodeInput {
  display: inline-block;
  margin: 10px auto;
}
</style>
