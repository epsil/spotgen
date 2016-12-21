var spotify = require('./spotify')

// alert('test')

// console = {}

// console.log = alert

// console.log('hm')

function submit () {
  alert('hello from submit')
  var form = document.querySelector('form')
  var textarea = document.querySelector('textarea')
  var str = textarea.value
  var playlist = new spotify.Playlist(str)
  playlist.dispatch().then(function (str) {
    textarea.value = str
    // alert(str)
  })
  return false
}



document.addEventListener('DOMContentLoaded', function () {
  var form = document.querySelector('form')
  form.onsubmit = submit
})


function main () {
  var playlist = new spotify.Playlist('test')

  playlist.dispatch().then(function (str) {
    alert(str)
  })
}

// main()
