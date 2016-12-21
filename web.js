var spotify = require('./spotify')

alert('test')

function main () {
  var playlist = new spotify.Playlist('test')

  playlist.dispatch().then(function (str) {
    alert(str)
  })
}

main()
