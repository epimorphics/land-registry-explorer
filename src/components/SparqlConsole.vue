<template>
  <div class="sparql-console">
    <codemirror id="codemirror"
                v-model="code" 
                :options="editorOption"
                @changes="onEditorChanges"
                @beforeChange="onEditorBeforeChange"
                @beforeSelectionChange="onEditorBeforeSelectionChange">
    </codemirror>
    <div class="my-fab">
      <md-button @click="runQuery" class="md-fab md-primary">
        <md-icon>play_arrow</md-icon>
      </md-button>
    </div>
  </div>
</template>

<script>
  export default {
    data () {
      return {
        editorOption: {
          inputStyle: 'contenteditable',
          tabSize: 2,
          foldGutter: true,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          matchBrackets: true,
          mode: 'application/sparql-query',
          theme: 'base16-light'
        }
      }
    },
    methods: {
      // Prforms a click on a result button in bottom navigation
      runQuery: function () {
        const resultButton = document.getElementById('result-button')
        resultButton.click()
      },
      // Returns the string index given a line and character number
      getIndexAt: function (string, line, char) {
        var currentLine = 0
        for (var x = 0; x < string.length; x++) {
          if (string[x] === '\n') {
            currentLine++
            continue
          }
          if (currentLine === line) {
            return x + char
          }
        }
      },
      // Cancels every selection made in the code by forcing the head to equal the anchor
      onEditorBeforeSelectionChange: function (codemirror, changeObject) {
        const ranges = JSON.parse(JSON.stringify(changeObject.ranges))
        ranges[0].head = JSON.parse(JSON.stringify(changeObject.ranges[0].anchor))
        changeObject.update(ranges)
      },
      // Cancels every change that is not a single character input or delete or an external value update
      onEditorBeforeChange: function (codemirror, changeObject) {
        if (changeObject.origin !== '+delete' && changeObject.origin !== '+input' && changeObject.origin !== 'setValue') {
          changeObject.cancel()
        }
      },
      // Updates queryPrefix, queryPostfix or postcode based on the changes user makes inside the console
      onEditorChanges: function (codemirror, changeObjects) {
        const newEditorState = codemirror.getValue()
        const postcodeStartIndex = this.queryPrefix.length
        const postcodeEndIndex = postcodeStartIndex + this.postcode.length
        for (var i = 0; i < changeObjects.length; i++) {
          const changeObject = changeObjects[i]
          const changedCharIndex = this.getIndexAt(codemirror.getValue(), changeObject.from.line, changeObject.from.ch)
          if (changeObject.origin === '+delete') {
            if (changedCharIndex < postcodeStartIndex) { // Change in query prefix
              this.queryPrefix = newEditorState.substring(0, postcodeStartIndex - 1)
            } else if (changedCharIndex < postcodeEndIndex) { // Change in the postcode
              this.postcode = newEditorState.substring(postcodeStartIndex, postcodeEndIndex - 1)
            } else { // Change in query postfix
              this.queryPostfix = newEditorState.substring(postcodeEndIndex, newEditorState.length)
            }
          } else if (changeObject.origin === '+input') {
            if (changedCharIndex < postcodeStartIndex) { // Change in query prefix
              this.queryPrefix = newEditorState.substring(0, postcodeStartIndex + 1)
            } else if (changedCharIndex <= postcodeEndIndex) { // Change in the postcode
              this.postcode = newEditorState.substring(postcodeStartIndex, postcodeEndIndex + 1)
            } else { // Change in query postfix
              this.queryPostfix = newEditorState.substring(postcodeEndIndex, newEditorState.length)
            }
          }
        }
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
      },
      code: {
        get: function () {
          return this.$store.getters.code
        }
      },
      queryPrefix: {
        get: function () {
          return this.$store.state.queryPrefix
        },
        set: function (newQueryPrefix) {
          this.$store.commit('updateQueryPrefix', newQueryPrefix)
        }
      },
      queryPostfix: {
        get: function () {
          return this.$store.state.queryPostfix
        },
        set: function (newQueryPostfix) {
          this.$store.commit('updateQueryPostfix', newQueryPostfix)
        }
      }
    }
  }
</script>

<style>
@import "../../node_modules/vue-material/dist/vue-material.css";

.sparql-console {
  width: 550px;
  height: 470px;
  text-align: left;
}

#run-query {
  background-color: #4CAF50;
  float: right;
}

.my-fab {
  position: relative;
  bottom: 85px;
  right: 15px;
  text-align: right;
  z-index: 5;
}
</style>