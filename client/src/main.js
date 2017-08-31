// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import Vuex from 'vuex'
import VueMaterial from 'vue-material'
import VueCodeMirror from 'vue-codemirror'
import App from './App'

Vue.config.productionTip = false

Vue.use(Vuex)
Vue.use(VueMaterial)
Vue.use(VueCodeMirror)

const store = new Vuex.Store({
  state: {
    postcode: '',
    queryPrefix: 'prefix xsd: <http://www.w3.org/2001/XMLSchema#>\n' +
                  'prefix ukhpi: <http://landregistry.data.gov.uk/def/ukhpi/>\n' +
                  'prefix lrppi: <http://landregistry.data.gov.uk/def/ppi/>\n' +
                  'prefix skos: <http://www.w3.org/2004/02/skos/core#>\n' +
                  'prefix lrcommon: <http://landregistry.data.gov.uk/def/common/>\n' +
                  '\n' +
                  'SELECT ?paon ?saon ?street ?town ?county ?propertyType ?postcode ?amount ?date ?category\n' +
                  'WHERE\n' +
                  '{\n' +
                  '  VALUES ?postcode {"',
    queryPostfix: '"^^xsd:string}\n' +
                  '\n' +
                  '  ?addr lrcommon:postcode ?postcode.\n' +
                  '\n' +
                  '  ?transx lrppi:propertyAddress ?addr ;\n' +
                  '  lrppi:pricePaid ?amount ;\n' +
                  '  lrppi:propertyType/skos:prefLabel ?propertyType ;\n' +
                  '  lrppi:transactionDate ?date ;\n' +
                  '  lrppi:transactionCategory/skos:prefLabel ?category.\n' +
                  '\n' +
                  '  OPTIONAL {?addr lrcommon:county ?county}\n' +
                  '  OPTIONAL {?addr lrcommon:paon ?paon}\n' +
                  '  OPTIONAL {?addr lrcommon:saon ?saon}\n' +
                  '  OPTIONAL {?addr lrcommon:street ?street}\n' +
                  '  OPTIONAL {?addr lrcommon:town ?town}\n' +
                  '}',
    queryResult: {}
  },
  mutations: {
    updatePostcode (state, postcode) {
      state.postcode = postcode
    },
    updateQueryResult (state, result) {
      state.queryResult = result
    },
    updateQueryPrefix (state, result) {
      state.queryPrefix = result
    },
    updateQueryPostfix (state, result) {
      state.queryPostfix = result
    }
  },
  getters: {
    code: state => {
      return state.queryPrefix + state.postcode + state.queryPostfix
    },
    queryResult: state => {
      return state.queryResult
    }
  }
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  template: '<App/>',
  components: { App }
})
