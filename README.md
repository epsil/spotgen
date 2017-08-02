spotgen
=======

[![npm](https://img.shields.io/npm/v/spotgen.svg)](https://www.npmjs.com/package/spotgen)

A tool for generating [Spotify](http://www.spotify.com/) playlists programmatically. Convert websites to Spotify playlists, incorporate [Last.fm](http://last.fm/) listener data, and employ smart algorithms to reorder the tracks.

Web demo: <https://epsil.github.io/spotgen/>

Installation
------------

Install [Node](http://nodejs.org/) and fetch the package with [`npm`](https://www.npmjs.com/package/spotgen):

    npm install -g spotgen

Note that on some systems, it might be necessary to prepend the `npm` command with [`sudo`](https://docs.npmjs.com/getting-started/installing-npm-packages-globally).

The generator can now be invoked from the command line as `spotgen` (see [usage](#command-line-version)).

Usage
-----

### Web demo

Go to <https://epsil.github.io/spotgen/>, enter a [generator string](#commands) in the text field and press *Create Playlist*.

### Command-line version

    spotgen input.txt output.spotify.txt

`input.txt` is a text file containing a [generator string](#commands), invoking any of the *commands* described below. `output.spotify.txt` will contain the generator's output, a list of [Spotify URIs](#spotify-uris) which can be [imported into Spotify](#importing-the-playlist).

You can also pass a generator string as a single argument. In that case, the Spotify URIs are written to standard output:

    spotgen "#artist Bowery Electric"
    spotgen "#similar Beach House\n#similar Hooverphonic"
    spotgen http://www.last.fm/user/username/library

Make sure to surround the string with quotes (`"`) if it contains spaces or special characters. Line breaks can be expressed as `\n`.

For more information, type `spotgen --help`.

### Importing the playlist

To **import** the playlist into Spotify:

1.  **Copy the output of the generator:** Choose *Edit -> Copy* (<kbd>Ctrl</kbd> + <kbd>C</kbd>).
2.  **Create a new playlist in Spotify:** Choose *File -> New Playlist* (<kbd>Ctrl</kbd> + <kbd>N</kbd>).
3.  **Paste into the playlist:** Select the playlist and choose *Edit -> Paste* (<kbd>Ctrl</kbd> + <kbd>V</kbd>).

Commands
--------

The generator effectively defines a "mini-language" for creating Spotify playlists. One can create a playlist in many ways: on the basis of [track titles](#tracks), [album titles](#albums), [artist names](#artists), [similar artists](#similar-artists), [top tracks](#top-tracks) or [webpages](#web-scraping).

Below follows a list of **generator commands**.

### Web scraping

The generator can scrape data from web pages. (Note that this functionality is only available in the [command-line version](#command-line-version).)

#### Last.fm

The generator can be instructed to fetch data from [Last.fm](http://last.fm/)'s webpages simply by supplying the page's address. For example, to create a playlist of artists similar to an artist, add the line:

    http://www.last.fm/music/Artist+Name/+similar

To create a playlist of a user's recently played tracks:

    http://www.last.fm/user/username/library

To fetch multiple pages in succession, add a number parameter:

    5 http://www.last.fm/user/username/library

This is functionally identical to:

    http://www.last.fm/user/username/library
    http://www.last.fm/user/username/library?page=2
    http://www.last.fm/user/username/library?page=3
    http://www.last.fm/user/username/library?page=4
    http://www.last.fm/user/username/library?page=5

Note that Last.fm displays listening history in reverse chronological order. To create a chronological playlist, add the [`#reverse`](#reverse) command.

[More on Last.fm scraping](Tips.md#lastfm).

#### Pitchfork

To scrape a [Pitchfork](http://pitchfork.com/) list:

    http://pitchfork.com/features/lists-and-guides/9980-the-50-best-albums-of-2016/

#### Rate Your Music

To scrape a [Rate Your Music](http://rateyourmusic.com/) chart:

    http://rateyourmusic.com/charts/top/album/2016

#### Reddit

To scrape a [Reddit](http://www.reddit.com/) forum:

    http://www.reddit.com/r/SoundsVintage/

To scrape a comments thread:

    http://www.reddit.com/r/Music/comments/2zpfv7/whats_the_catchiest_song_you_know_that_just_makes/

When scraping threads, it can be a good idea to add the [`#order by lastfm`](#order) command. This will order the results by [Last.fm](http://last.fm/) popularity, thereby filtering out noise.

#### YouTube

To convert a [YouTube](http://www.youtube.com/) playlist:

    http://www.youtube.com/watch?v=yWEK4v9AVKQ&list=PLChOO_ZAB22WuyDODJ3kjJiU0oQzWOTyb

### Top tracks

To retrieve the top 10 tracks of an artist, pass the following to the generator:

    #top Aphex Twin

The generator will output a playlist consisting of the ten most popular tracks of Aphex Twin, which can then be [imported](#usage) into Spotify.

All of the commands listed here can be used multiple times. For example:

    #top Aphex Twin
    #top Beach House

This will create a playlist consisting of the top tracks of Aphex Twin, followed by the top tracks of Beach House.

To retrieve only the top 5 tracks, use `#top5`.

To retrieve *all* tracks, use [`#artist`](#artists).

### Similar artists

To find similar artists:

    #similar Aphex Twin

This will generate a 100-track playlist consisting of the 5 most popular tracks from the 20 most similar artists to Aphex Twin.

To retrieve more tracks, use `#similar10`.

### Albums

To add an album:

    #album Biosphere - Substrata

Alternatively, use the album's Spotify link or Spotify URI:

    https://open.spotify.com/album/5QIf4hNIAksV1uMCXHVkAZ

### Artists

To add all the albums of an artist:

    #artist Beach House

Alternatively, use the artist's Spotify link or Spotify URI:

    https://open.spotify.com/artist/56ZTgzPBDge0OvCGgMO3OY

Note that this command can be rather slow, as it attempts to retrieve every single track by the artist, including tracks from collaboration and compilation albums. A fast alternative is the [`#top`](#top-tracks) command.

### Playlist

To add all the tracks of a playlist:

    #playlist username:playlistid

where `username` is the owner of the playlist and `playlistid` is the ID of the playlist.

Alternatively, use the playlist's Spotify link or Spotify URI:

    https://open.spotify.com/user/redditlistentothis/playlist/6TMNC59e1TuFFE48tJ9V2D

### Tracks

To add a single track to the playlist, add a line on the form `ARTIST - TRACK`:

    Beach House - Walk in the Park
    Beach House - Irene
    Beach House - Other People
    Beach House - Troublemaker
    Beach House - Wishes

Alternatively, use the track's Spotify link or Spotify URI:

    https://open.spotify.com/track/4oNXgGnumnu5oIXXyP8StH

[More on single tracks](Tips.md#miscellaneous).

### Duplicates

By default, the generator automatically removes duplicate tracks. To allow duplicates, add the line:

    #duplicates

### Reverse

To reverse the order of the tracks, add the line:

    #reverse

### Shuffle

To shuffle the order of the tracks, add the line:

    #shuffle

### Order

To order the tracks by Spotify popularity, use `#order by`:

    #order by popularity
    #artist Beach House

The generator also provides [Last.fm](http://last.fm/) support. To order by Last.fm playcount, add the line `#order by lastfm`:

    #order by lastfm
    #artist Beach House

To order by Last.fm user playcount, add the Last.fm username at the end:

    #order by lastfm username
    #artist Beach House

### Group

To sort the ordered tracks into groups, use `#group by`:

    #order by lastfm
    #group by artist
    #similar Beach House

This will create a Last.fm-ordered playlist of artists similar to Beach House, where tracks from the same artists are grouped together.

### Alternate

To group the tracks and then interleave them, use `#alternate by`:

    #order by popularity
    #alternate by artist
    #similar Beach House
    #similar Hooverphonic

This will create a Last.fm-ordered playlist of artists similar to Beach House and Hooverphonic, with each track having a different artist from the previous track.

Supported formats
-----------------

The generator can work with [Spotify links](#spotify-links), [Spotify URIs](#spotify-uris), [M3U playlists](#m3u-playlists) and [CSV files](#comma-separated-values). By default, the generator outputs a list of Spotify URIs.

### Import existing Spotify playlists

The generator understands Spotify links and Spotify URIs. These are usually obtained by opening the item in Spotify and choosing *More* -> *Share* (click on the `...` symbol).

#### Spotify links

The following example creates a new playlist out of an existing playlist, applying the [`#order`](#order) command in the process:

    #order by popularity
    https://open.spotify.com/user/redditlistentothis/playlist/6TMNC59e1TuFFE48tJ9V2D

Another method is to select the playlist's tracks in Spotify, copy them, and then paste them into a text file. This produces a list of Spotify track links:

    https://open.spotify.com/track/4oNXgGnumnu5oIXXyP8StH
    https://open.spotify.com/track/7rAjeWkQM6cLqbPjZtXxl2
    https://open.spotify.com/track/2Nt4Uw91pQLXSJ28SttDdF
    ...

#### Spotify URIs

Spotify URIs are the default output format of the generator. They look like this:

    spotify:track:4oNXgGnumnu5oIXXyP8StH
    spotify:track:7rAjeWkQM6cLqbPjZtXxl2
    spotify:track:2Nt4Uw91pQLXSJ28SttDdF
    ...

### M3U playlists

One can also import [M3U](http://en.wikipedia.org/wiki/M3U) playlists (with the file extension `.m3u` or `.m3u8`), provided they contain `EXTM3U` metadata. That is, the playlist should be on the form:

    #EXTM3U
    #EXTINF:404,Desire Lines - Deerhunter
    Deerhunter/Halcyon Digest/06 Desire Lines.mp3
    #EXTINF:230,Saved By Old Times - Deerhunter
    Deerhunter/Microcastle/10 Saved By Old Times.mp3
    #EXTINF:202,Agoraphobia - Deerhunter
    Deerhunter/Microcastle/02 Agoraphobia.mp3
    #EXTINF:133,Revival - Deerhunter
    Deerhunter/Halcyon Digest/03 Revival.mp3
    #EXTINF:264,Twilight at Carbon Lake - Deerhunter
    Deerhunter/Microcastle/12 Twilight at Carbon Lake.mp3

The generator translates this to:

    Deerhunter - Desire Lines
    Deerhunter - Saved By Old Times
    Deerhunter - Agoraphobia
    Deerhunter - Revival
    Deerhunter - Twilight at Carbon Lake

[More on M3U playlists](Tips.md#m3u-playlists).

### Comma-separated values

The generator can read and write the CSV format used by [Exportify](https://github.com/watsonbox/exportify):

    spotify:track:3jZ0GKAZiDMya0dZPrw8zq,Desire Lines,Deerhunter,Halcyon Digest,1,6,404413,,
    spotify:track:20DDHYR4vZqDwHyNFLwkXI,Saved By Old Times,Deerhunter,Microcastle,1,10,230226,,
    spotify:track:2SpHd4lGMrJMIQDf92V6VP,Agoraphobia,Deerhunter,Microcastle,1,2,202640,,
    spotify:track:30wvVTkqA4Fp5ZCG0xGof7,Revival,Deerhunter,Halcyon Digest,1,3,133666,,
    spotify:track:6vtwbm7YGkTwTINdrcXV5I,Twilight At Carbon Lake,Deerhunter,Microcastle,1,12,263986,,

To output to this format, add the line `#csv`:

    #csv
    Deerhunter - Desire Lines
    Deerhunter - Saved By Old Times
    Deerhunter - Agoraphobia
    Deerhunter - Revival
    Deerhunter - Twilight at Carbon Lake

CSV files have the advantage of being editable with a spreadsheet editor such as Microsoft Excel or LibreOffice Calc. They are also future-proof, as they contain additional info to the Spotify URIs. (The URIs might, conceivably, change or become outdated. On the other hand, the title, artist and album of a track can be used to find that track on any music streaming service.)

Web demo
--------

The generator is available as a single-page application running in the browser. It is hosted at <https://epsil.github.io/spotgen/>.

The generator code runs entirely on the client side. However, because of restrictions in Spotify's authentication service, the user first has to log in with their Spotify account. Despite the warning, the application does not access any private data. (Alternatively, the [command-line version](#command-line-version) can be used without logging in.)

The web demo does not support [web scraping](#web-scraping), due to browser limits on [cross-site requests](http://en.wikipedia.org/wiki/Cross-origin_resource_sharing). For this, one has to use the command-line version.

It is also possible to run the web demo locally:

    npm run http

This will start up a `http-server` instance at <http://localhost:9000/>.

Note that Spotify's authentication service requires the web demo to be hosted at a whitelisted address. This is the reason for running `http-server` at port 9000 (merely opening `index.html` in a browser will not work).

For more information about authentication, see the [developer documentation](https://epsil.github.io/spotgen/doc/SpotifyAuthenticator.html), as well as the official [Spotify Web API documentation](http://developer.spotify.com/web-api/authorization-guide/#implicit-grant-flow).

Library
-------

The generator is also available as a library which can be utilized by your own project. To install it in your project's `node_modules/` folder:

    npm install --save spotgen

The following example demonstrates how to use the library:

```js
var Generator = require('spotgen')
var spotgen = new Generator('#top Beach House\n#top Deer Hunter')
spotgen.generate().then(function (result) {
  // do something with the Spotify URIs,
  // e.g., output them to the console
  console.log(result)
})
```

The `generate()` method returns a [promise](https://www.promisejs.org/) that contains the Spotify URIs, represented as a newline-separated string. To access this value, use the `then()` callback as shown.

Note that if you are writing your own application for Spotify, then you should [register your application](https://developer.spotify.com/web-api/authorization-guide/#introduction) and obtain a client ID and client secret key. These are passed to the `Generator` class like so:

```js
var spotgen = new Generator('#top Beach House', clientId, clientKey)
```

The generator will then use these values to acquire an access token for web API requests. If you already have a token, you can pass it to `Generator`:

```js
var spotgen = new Generator('#top Beach House', clientId, clientKey, token)
```

Developer version
-----------------

Instead of installing the package with `npm`, one can fetch the source code from [GitHub](https://github.com/epsil/spotgen):

    git clone https://github.com/epsil/spotgen.git

Then fetch all depencies with `npm install`:

    cd spotgen
    npm install

Then create a global package link with `npm link`:

    npm link

### Unit tests

The package includes a test suite. To run it, type:

    npm test

License
-------

[MIT License](LICENSE).

Links
-----

-   [Web demo](https://epsil.github.io/spotgen/)
-   [npm package](https://www.npmjs.com/package/spotgen)
-   [GitHub repository](https://github.com/epsil/spotgen)
-   [Developer documentation](https://epsil.github.io/spotgen/doc/)
-   [Spotify Web API documentation](http://developer.spotify.com/web-api/authorization-guide/#implicit-grant-flow)
-   [Additional tips](Tips.md)

### See also

-   [Spotlistr](http://spotlistr.herokuapp.com/) ([source](https://github.com/BobNisco/Spotlistr)), feature-rich AngularJS conversion app
-   [Exportify](https://github.com/watsonbox/exportify), for exporting Spotify playlists to CSV format

#### Recommendations

-   [MagicPlaylist](http://magicplaylist.co/) ([source](https://github.com/loverajoel/magicplaylist))
-   [20v](http://20v.co/) ([source](https://github.com/fusenlabs/20v))
-   [Spotibot](http://www.spotibot.com/)
