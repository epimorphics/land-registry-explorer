<template>
  <div class="google-map" id="gmap"></div>
</template>

<script>
const chroma = require('chroma-js')
const turf = require('@turf/turf')
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

    map.addListener('idle', function () {
      if (!mVue.populatingData) {
        mVue.mapCenter = map.getCenter()
        mVue.getNearbyPostcodes()
      }
    })
    mVue.map = map
  },
  methods: {
    updateMapCenter: function () {
      const url = `https://api.postcodes.io/postcodes/${this.postcode}`
      console.log(`Centroid URL: ${url}`)
      return axios.get(url).then((response) => {
        const latitude = response.data.result.latitude
        const longitude = response.data.result.longitude
        this.mapCenter = new window.google.maps.LatLng(latitude, longitude)
        // console.log(`updateMapCenter: ${JSON.stringify(this.mapCenter)}`)
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
        this.generateVoronoi()
      })
    },
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
      let polygons = voronoi(centroids).polygons()

      var postcodePolygons = []
      polygons.forEach((polygon) => {
        // Reverse coordinate order so it conforms to the right-hand rule.
        // Close the ring by making the last position the same as the first.
        polygon.reverse().push(polygon[0])
        var postcodePolygon = turf.polygon([polygon])
        this.visiblePostcodes.forEach((postcodePoint) => {
          if (turf.inside(postcodePoint, postcodePolygon)) {
            postcodePolygon.id = postcodePoint.id
            postcodePolygon.properties = postcodePoint.properties
            postcodePolygon.properties.centroid = postcodePoint.geometry.coordinates
          }
        })
        postcodePolygons.push(postcodePolygon)
      })
      this.clearShapes()
      this.visiblePostcodes = postcodePolygons
      // console.log(`generateVoronoi: ${JSON.stringify(this.visiblePostcodes)}`)
      this.populateData()
    },
    clearShapes: function () {
      this.map.data.forEach((feature) => {
        this.map.data.remove(feature)
      })
      this.visiblePostcodes = []
    },
    populateData: function () {
      var min = Infinity
      var max = -Infinity
      this.visiblePostcodes.forEach((postcode) => {
        this.map.data.addGeoJson(postcode)
        if (postcode.properties.averagePaid > max) max = postcode.properties.averagePaid
        if (postcode.properties.averagePaid < min) min = postcode.properties.averagePaid
      })

      const bezInterpolator = chroma.scale(['yellow', 'red', 'black'])
      this.map.data.setStyle((feature) => {
        var colorIndex = (feature.getProperty('averagePaid') - min) / (max - min)
        var color = bezInterpolator(colorIndex)
        return {
          fillColor: color,
          strokeWeight: 1
        }
      })

      this.map.data.addListener('click', function (event) {
        if (this.infoWindow) {
          this.infoWindow.close()
        }
        const centroid = event.feature.getProperty('centroid')
        const averagePricePaid = event.feature.getProperty('averagePaid').toLocaleString('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 2 })
        const message = `<p><b>${event.feature.getId()}</b></p>` +
                        `<p>Average Price Paid: ${averagePricePaid}</p>`
        this.infoWindow = new window.google.maps.InfoWindow({
          content: message,
          position: new window.google.maps.LatLng(centroid[1], centroid[0])
        })
        this.infoWindow.open(this.map)
      })
      this.populatingData = false
    }
  },
  computed: {
    postcode () {
      return this.$store.state.postcode
    }
  },
  watch: {
    mapCenter: function () {
      this.map.panTo(this.mapCenter)
    },
    postcode: function (newPostcode) {
      if (newPostcode.length === 7) {
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
