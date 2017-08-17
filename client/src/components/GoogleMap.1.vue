<template>
  <gmap-map
    :center="center"
    :zoom="16"
    style="width: 800px; height: 600px; margin: 0 auto; background: gray;"
  >
    <gmap-polygon
      v-for="(poly, index) in polygons"
      $polygonObject=poly
      :key="index"
      :clickable="true"
      :draggable="true"
    ></gmap-polygon>
  </gmap-map>
</template>
 
<script>
  import * as VueGoogleMaps from 'vue2-google-maps';
  import Vue from 'vue';

  Vue.use(VueGoogleMaps, {
    load: {
      key: 'AIzaSyD9Z1uBEkldyh5_m2JqIj8KlxrcXYwMO0w',
    },
  });

  export default {
    data() {
      return {
        center: {
          lat: 51.480238,
          lng: -2.768048,
        },
        polygons: [],
      };
    },
  };
</script> 
