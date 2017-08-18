<template>
  <div class="google-map" id="gmap"></div>
</template>

<script>
const axios = require('axios')

export default {
  name: 'google-map',
  props: ['center'],
  data () {
    return {
      map: {},
      polygons: []
    }
  },
  mounted () {
    const element = document.getElementById('gmap')
    const options = {
      zoom: 16,
      center: this.center
    }
    // eslint-disable-next-line
    const map = new window.google.maps.Map(element, options)
    this.map = map
    map.addListener('idle', function () {
      const topRightLat = map.getBounds().getNorthEast().lat()
      const topRightLng = map.getBounds().getNorthEast().lng()
      const botLeftLat = map.getBounds().getSouthWest().lat()
      const botLeftLng = map.getBounds().getSouthWest().lng()

      const url = `/postcodes/within/${topRightLat}/${topRightLng}/${botLeftLat}/${botLeftLng}`
      console.log(`URL: ${url}`)

      axios.get(url).then((response) => {
        const result = response.data
        result.forEach((feature) => {
          var polygonCoordinates = []
          const inputCoordinates = feature.geometry.coordinates[0]
          inputCoordinates.forEach((coordinate) => {
            polygonCoordinates.push(new window.google.maps.LatLng(coordinate[1], coordinate[0]))
          })
          var polygon = new window.google.maps.Polygon({
            paths: polygonCoordinates,
            strokeColor: '#00FF00',
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: '#00FF00',
            fillOpacity: 0.35
          })
          polygon.setMap(map)
        })
      }).catch((error) => {
        console.log(`Error: ${error}`)
      })
    })
  },
  methods: {
    updateMapCenter (newCenter) {
      alert(`Have been told to move to ${newCenter}`)
      this.map.panTo(newCenter)
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
