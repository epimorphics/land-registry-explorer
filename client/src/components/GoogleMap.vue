<template>
  <div class="google-map" id="gmap"></div>
</template>

<script>
export default {
  name: 'google-map',
  props: ['name'],
  data() {
    return { };
  },
  mounted() {
    const element = document.getElementById('gmap');
    const options = {
      zoom: 14,
      center: new window.google.maps.LatLng(51.501527, -0.1921837),
    };
    // eslint-disable-next-line
    const map = new window.google.maps.Map(element, options);
  },
};
</script> 

<style scoped>
.google-map {
  width: 800px;
  height: 600px;
  margin: 0 auto;
  background: gray;
}
</style>