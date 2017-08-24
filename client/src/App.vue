<template>
  <div id="app">
    <div>
      <md-input-container>
          <label>Postcode</label>
        <md-input v-model="selectedPostcode"></md-input>
      </md-input-container>
    </div>
    <div>
      <div v-if="currentView==='map'">
        <GoogleMap id="gmap"
                  ref="gmap"
                  v-on:emitMapCenter="readMapCenter"
                  :mapCenter="mapCenter" ></GoogleMap>
      </div>
      <div v-else-if="currentView==='query'">
        <SparqlConsole id="console"></SparqlConsole>
      </div>
      <div v-else>
        <ResultView id="result">Results can be interesting</ResultView>
      </div>
    </div>
    <md-bottom-bar>
      <md-bottom-bar-item @click="currentView='map'" md-active>Map</md-bottom-bar-item>
      <md-bottom-bar-item @click="currentView='query'">Query</md-bottom-bar-item>
      <md-bottom-bar-item @click="currentView='result'">Result</md-bottom-bar-item>
    </md-bottom-bar>
  </div>
</template>

<script>
  import GoogleMap from '@/components/GoogleMap'
  import SparqlConsole from '@/components/SparqlConsole'
  import ResultView from '@/components/ResultView'

  const axios = require('axios')
  const Promise = require('bluebird')
  const turf = require('@turf/turf')

  export default {
    name: 'app',
    data () {
      return {
        currentView: 'map',
        selectedPostcode: '',
        visiblePostcodes: [],
        mapCenter: new window.google.maps.LatLng(51.46040383078197, -2.6015971891367826)
      }
    },
    components: {
      GoogleMap,
      SparqlConsole,
      ResultView
    },
    methods: {
      updateCenter: function () {
        const url = `https://api.postcodes.io/postcodes/${this.selectedPostcode}`
        console.log(`Centroid URL: ${url}`)
        axios.get(url).then((response) => {
          const latitude = response.data.result.latitude
          const longitude = response.data.result.longitude
          this.mapCenter = new window.google.maps.LatLng(latitude, longitude)
          // console.log(`updateCenter: ${JSON.stringify(this.mapCenter)}`)
        }).then(() => {
          this.getNearbyPostcodes()
        }).catch((error) => {
          console.log(`Error: ${error}`)
        })
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
          // console.log(postcode.properties.url)
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
        if (this.displayMap) {
          this.displayMap = false
          this.displayConsole = true
        } else {
          this.displayMap = true
          this.displayConsole = false
        }
      }
    },
    watch: {
      selectedPostcode: function (newPostcode) {
        this.$store.commit('updatePostcode', newPostcode)
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
  height: 480px;
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

</style>
