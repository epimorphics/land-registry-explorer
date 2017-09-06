<template>
  <div class="google-map" id="gmap"></div>
</template>

<script>
const chroma = require('chroma-js')
const turf = require('@turf/helpers')
const turfInside = require('@turf/inside')
const d3voronoi = require('d3-voronoi')
const axios = require('axios')
const Promise = require('bluebird')

export default {
  name: 'google-map',
  data () {
    return {
      visiblePostcodes: [],
      map: {},
      mapCenter: new window.google.maps.LatLng(51.46040383078197, -2.6015971891367826),
      infoWindow: new window.google.maps.InfoWindow(),
      populatingData: false
    }
  },
  mounted () {
    this.updateMapCenter()
    const mVue = this
    const element = document.getElementById('gmap')
    const options = {
      zoom: 17,
      center: this.mapCenter,
      disableDefaultUI: true,
      zoomControl: true,
      minZoom: 17,
      maxZoom: 18
    }
    const map = new window.google.maps.Map(element, options)
    // Map on idle listener updates the data layer
    map.addListener('idle', function () {
      if (!mVue.populatingData) {
        mVue.mapCenter = map.getCenter()
        mVue.getNearbyPostcodes()
      }
    })
    mVue.map = map
  },
  methods: {
    // Updates the map center to match the given postcode centroid
    updateMapCenter: function () {
      if (this.postcode.length < 6) return
      const url = `https://api.postcodes.io/postcodes/${this.postcode}`
      return axios.get(url).then((response) => {
        this.mapCenter = new window.google.maps.LatLng(response.data.result.latitude, response.data.result.longitude)
      }).catch((error) => {
        console.log(error)
      })
    },
    // Updates a list of visible postcodes with geoJSON points representing postcode centroids which are returned from the API call
    getNearbyPostcodes: function () {
      this.visiblePostcodes = []
      const url = `https://api.postcodes.io/postcodes?lon=${this.mapCenter.lng()}&lat=${this.mapCenter.lat()}&radius=300&limit=99`
      axios.get(url).then((response) => {
        response.data.result.forEach((result) => {
          var postcode = turf.point([result.longitude, result.latitude])
          postcode.id = result.postcode
          this.visiblePostcodes.push(postcode)
        })
      }).then(() => {
        this.populateURLs()
      }).catch((error) => {
        console.log(error)
      })
    },
    // Loops through visiblePostcodes and generates an url for querying the land registry api
    populateURLs: function () {
      this.visiblePostcodes.forEach((postcode) => {
        var url = `http://landregistry.data.gov.uk/data/ppi/transaction-record.json?_page=0&propertyAddress.postcode=${postcode.id}&_pageSize=50`
        url = url.replace(` `, `%20`)
        postcode.properties.url = url
      })
      this.getData()
    },
    // Runs an API call for all visible postcodes and calculates the average price paid
    getData: function () {
      Promise.map(this.visiblePostcodes, postcode => axios.get(postcode.properties.url).then((response) => {
        var totalPaid = 0
        const data = response.data.result.items
        data.forEach((transaction) => {
          totalPaid += transaction.pricePaid
        })
        postcode.properties.averagePaid = (totalPaid) ? totalPaid / data.length : 0
      }).catch((error) => {
        console.log(error)
      }), { concurrency: 10 }).then(() => {
        this.generateVoronoi()
      })
    },
    // Given a set of postcode centroids it creates a set of approximated postcode boundaries using a voronoi algorithm
    generateVoronoi: function () {
      var centroids = []
      this.visiblePostcodes.forEach((postcode) => {
        centroids.push(postcode.geometry.coordinates)
      })

      const maxY = this.map.getBounds().getNorthEast().lat() + 0.005
      const maxX = this.map.getBounds().getNorthEast().lng() + 0.005
      const minY = this.map.getBounds().getSouthWest().lat() - 0.005
      const minX = this.map.getBounds().getSouthWest().lng() - 0.005

      let voronoi = d3voronoi.voronoi().extent([[minX, minY], [maxX, maxY]])
      let voronoiPolygons = voronoi(centroids).polygons()

      var postcodePolygons = []
      voronoiPolygons.forEach((polygon) => {
        // Reverse coordinate order so it conforms to the right-hand rule.
        // Close the ring by making the last position the same as the first.
        polygon.reverse().push(polygon[0])
        var postcodePolygon = turf.polygon([polygon])
        this.visiblePostcodes.forEach((postcodePoint) => {
          if (turfInside(postcodePoint, postcodePolygon)) {
            postcodePolygon.id = postcodePoint.id
            postcodePolygon.properties = postcodePoint.properties
            postcodePolygon.properties.centroid = postcodePoint.geometry.coordinates
          }
        })
        postcodePolygons.push(postcodePolygon)
      })
      this.clearShapes()
      this.visiblePostcodes = postcodePolygons
      this.populateData()
    },
    // Removes all the features from the map data layer
    clearShapes: function () {
      this.map.data.forEach((feature) => {
        this.map.data.remove(feature)
      })
      this.visiblePostcodes = []
    },
    // Populates the map data layer with the visiblePostcode polygons
    populateData: function () {
      var min = Infinity
      var max = -Infinity
      this.visiblePostcodes.forEach((postcode) => {
        this.map.data.addGeoJson(postcode)
        if (postcode.properties.averagePaid > max) max = postcode.properties.averagePaid
        if (postcode.properties.averagePaid < min) min = postcode.properties.averagePaid
      })
      this.setPolygonsColor(min, max)
    },
    // Colors the polygons based on the average price paid
    setPolygonsColor: function (min, max) {
      const bezInterpolator = chroma.scale(['#E8FF3C', '#FF4500', '#D90000'])
      this.map.data.setStyle((feature) => {
        const avgPaid = feature.getProperty('averagePaid')
        var colorIndex = (avgPaid - min) / (max - min)
        var color = (avgPaid) ? bezInterpolator(colorIndex) : '#ffffff'
        return {
          fillColor: color,
          strokeWeight: 1
        }
      })
      this.setOnFeatureClickListener()
    },
    // Sets a map data on click listener to open an info window
    setOnFeatureClickListener: function () {
      const mVue = this
      this.map.data.addListener('click', function (event) {
        if (mVue.infoWindow) {
          mVue.infoWindow.close()
        }
        const centroid = event.feature.getProperty('centroid')
        const averagePricePaid = mVue.prettyPrintCurrency(event.feature.getProperty('averagePaid'))
        const message = `<p><b>${event.feature.getId()}</b></p>` +
                        `<p>Average Price Paid: ${averagePricePaid}</p>`
        mVue.infoWindow = new window.google.maps.InfoWindow({
          content: message,
          position: new window.google.maps.LatLng(centroid[1], centroid[0])
        })
        mVue.postcode = event.feature.getId()
        mVue.infoWindow.open(mVue.map)
      })
      this.populatingData = false
    },
    // Converts a number into a currency string
    prettyPrintCurrency: function (amount) {
      return amount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 })
    }
  },
  computed: {
    postcode: {
      get: function () {
        return this.$store.state.postcode
      },
      set: function (newPostcode) {
        this.$store.commit('updatePostcode', newPostcode)
      }
    }
  },
  watch: {
    // When mapCenter is updated set the map camera to the new location
    mapCenter: function () {
      this.map.panTo(this.mapCenter)
    },
    // If the updated postcode is of at least the mimimum postcode length update the data layer
    postcode: function (newPostcode) {
      if (newPostcode.length > 5) {
        this.populatingData = true
        this.updateMapCenter().then(() => {
          this.getNearbyPostcodes()
        })
      }
    }
  }
}
</script> 

<style scoped>
.google-map {
  width: 550px;
  height: 470px;
  margin: 0 auto;
  background: gray;
}
</style>
