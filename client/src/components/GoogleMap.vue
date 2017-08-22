<template>
  <div class="google-map" id="gmap"></div>
</template>

<script>
const axios = require('axios')
const chroma = require('chroma-js')

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
      this.postcodes = postcodes
      console.log(`GoogleMap retrieved: ${JSON.stringify(postcodes)}`)
    },
    populateData: function (updatedPostcodes) {
      var min = Infinity
      var max = -Infinity
      updatedPostcodes.forEach((postcode) => {
        if (postcode.properties.averagePaid > max) max = postcode.properties.averagePaid
        if (postcode.properties.averagePaid < min) min = postcode.properties.averagePaid
        this.map.data.getFeatureById(postcode.id).setProperty('averagePaid', postcode.properties.averagePaid)
        this.map.data.getFeatureById(postcode.id).setProperty('centroid', postcode.properties.centroid)
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
      center: this.mapCenter
    }
    const map = new window.google.maps.Map(element, options)

    map.addListener('idle', function () {
      mVue.clearShapes()

      const topRightLat = map.getBounds().getNorthEast().lat()
      const topRightLng = map.getBounds().getNorthEast().lng()
      const botLeftLat = map.getBounds().getSouthWest().lat()
      const botLeftLng = map.getBounds().getSouthWest().lng()

      const url = `/postcodes/within/${topRightLat}/${topRightLng}/${botLeftLat}/${botLeftLng}`
      console.log(`URL: ${url}`)

      var newPostcodes = []

      axios.get(url).then((response) => {
        const result = response.data
        result.forEach((feature) => {
          feature.id = feature.properties.postcode
          map.data.addGeoJson(feature)
          newPostcodes.push(feature)
        })
      }).catch((error) => {
        console.log(`Error: ${error}`)
      })
      mVue.postcodes = newPostcodes
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
