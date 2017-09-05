(function (global) {
  var scripts = document.getElementsByTagName('script')
  var url = 'http://192.168.1.217:8080'

  scripts.forEach(function (script) {
    if (script.src === url) {
      var iframe = document.createElement("IFRAME")
      iframe.setAttribute("src", `${url}/index.html`)
      iframe.setAttribute('width', '550')
      iframe.setAttribute('height', '600')
      iframe.setAttribute('frameborder', '0')
      iframe.setAttribute('scrolling', 'no')
      script.parentNode.insertBefore(iframe, script)
      // document.body.appendChild(iframe)
    }
  })
}(this))
