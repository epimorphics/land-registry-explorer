<template>
  <div class="google-map" id="gmap"></div>
</template>

<script>
const chroma = require('chroma-js')
const turf = require('@turf/turf')
const d3voronoi = require('d3-voronoi')

export default {
  name: 'google-map',
  props: ['mapCenter'],
  data () {
    return {
      map: {},
      postcodes: [],
      infoWindow: new window.google.maps.InfoWindow()
    }
  },
  methods: {
    clearShapes: function () {
      this.map.data.forEach((feature) => {
        this.map.data.remove(feature)
      })
      this.postcodes = []
    },
    generateVoronoi: function (postcodes) {
      var centroids = []
      postcodes.forEach((postcode) => {
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
        // console.log(turfPolygon)
        postcodes.forEach((postcodePoint) => {
          if (turf.inside(postcodePoint, postcodePolygon)) {
            postcodePolygon.id = postcodePoint.id
            postcodePolygon.properties = postcodePoint.properties
            postcodePolygon.properties.centroid = postcodePoint.geometry.coordinates
          }
        })
        postcodePolygons.push(postcodePolygon)
      })
      this.clearShapes()
      this.postcodes = postcodePolygons
      console.log(`generateVoronoi: ${JSON.stringify(this.postcodes)}`)
      this.populateData()
    },
    populateData: function () {
      var min = Infinity
      var max = -Infinity
      this.postcodes.forEach((postcode) => {
        this.map.data.addGeoJson(postcode)
        if (postcode.properties.averagePaid > max) max = postcode.properties.averagePaid
        if (postcode.properties.averagePaid < min) min = postcode.properties.averagePaid
      })

      const bezInterpolator = chroma.scale(['yellow', 'red'])
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
        const message = `<p><b>${event.feature.getId()}</b></p>` +
                        `<p>Average Price Paid: £${event.feature.getProperty('averagePaid')}</p>`
        this.infoWindow = new window.google.maps.InfoWindow({
          content: message,
          position: new window.google.maps.LatLng(centroid[1], centroid[0])
        })
        this.infoWindow.open(this.map)
      })
    }
  },
  mounted () {
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
      mVue.$emit('emitMapCenter', map.getCenter())
    })
    mVue.map = map
  },
  watch: {
    mapCenter: function () {
      this.map.panTo(this.mapCenter)
    }
  }
}
</script> 

<style scoped>
.google-map {
  width: 450px;
  height: 250px;
  margin: 0 auto;
  background: gray;
}
</style>
