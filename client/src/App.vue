<template>
  <div id="app">
    <div>
      <div class="postcodeInput">Postcode:</div>
      <input class="postcodeInput" v-model="selectedPostcode" placeholder="BS2 8BS"></input>
      <button class="postcodeInput" v-on:click="updateCenter">Submit</button>
    </div>
    <GoogleMap ref="gmap" 
               v-on:emitVisiblePostcodes="updateVisiblePostcodes" 
               :mapCenter="mapCenter" ></GoogleMap>
  </div>
</template>

<script>
  import GoogleMap from '@/components/GoogleMap'

  const axios = require('axios')
  const Promise = require('bluebird')

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
        const url = `/postcodes/center/${this.selectedPostcode}`
        console.log(`URL: ${url}`)

        axios.get(url).then((response) => {
          const result = response.data
          this.mapCenter = new window.google.maps.LatLng(result[1], result[0])
          console.log(JSON.stringify(this.mapCenter))
        }).catch((error) => {
          console.log(`Error: ${error}`)
        })
      },
      updateVisiblePostcodes: function (newVisiblePostcodes) {
        this.visiblePostcodes = newVisiblePostcodes
        this.getData()
      },
      getData: function () {
        this.populateURLs()
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
          this.$refs.gmap.populateData(this.visiblePostcodes)
        })
      },
      populateURLs: function () {
        this.visiblePostcodes.forEach((postcode) => {
          var url = `http://landregistry.data.gov.uk/data/ppi/transaction-record.json?_page=0&propertyAddress.postcode=${postcode.id}&_pageSize=50`
          url = url.replace(` `, `%20`)
          postcode.properties.url = url
        })
      }
    }
  }
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
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

.postcodeInput {
  display: inline-block;
  margin: 10px auto;
}
</style>
