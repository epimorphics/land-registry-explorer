<template>
  <div class="google-map" id="gmap"></div>
</template>

<script>
const axios = require('axios')

export default {
  name: 'google-map',
  props: ['name'],
  data () {
    return {
      polygons: []
    }
  },
  mounted () {
    const element = document.getElementById('gmap')
    const options = {
      zoom: 16,
      center: new window.google.maps.LatLng(51.480238, -2.768048)
    }
    // eslint-disable-next-line
    const map = new window.google.maps.Map(element, options)
    map.addListener('idle', function () {
      const topRightLat = map.getBounds().getNorthEast().lat()
      const topRightLng = map.getBounds().getNorthEast().lng()
      const botLeftLat = map.getBounds().getSouthWest().lat()
      const botLeftLng = map.getBounds().getSouthWest().lng()
      console.log(topRightLat)
      console.log(topRightLng)
      console.log(botLeftLat)
      console.log(botLeftLng)
      const url = `http://localhost:6364/postcodes/within/${topRightLat}/${topRightLng}/${botLeftLat}/${botLeftLng}`
      axios.get(url).then((response) => {
        alert(`${url}`)
      }).catch((error) => {
        alert(error)
      })
    })
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
