[Spotify Playlist Generator](https://github.com/epsil/spotify-js)
=================================================================

> A command-line script for generating Spotify playlists.
>
> Written in JavaScript, requires [Node](https://nodejs.org/).

Examples
--------

-   [Pitchfork's 50 Best Albums of 2016](examples/pitchfork-50-best-albums-of-2016.spotify.txt) ([source](examples/pitchfork-50-best-albums-of-2016.txt))
-   [Pitchfork's Honorable Mentions of 2015](examples/pitchfork-honorable-mentions-of-2015.spotify.txt) ([source](examples/pitchfork-honorable-mentions-of-2015.txt))
-   [Pitchfork's 50 Best Ambient Albums of All Time](examples/pitchfork-50-best-ambient-albums-of-all-time.spotify.txt) ([source](examples/pitchfork-50-best-ambient-albums-of-all-time.txt))
-   [Rate Your Music's Top Albums of 2016](examples/rateyourmusic-top-albums-of-2016.spotify.txt) ([source](examples/rateyourmusic-top-albums-of-2016.txt))
-   [Rate Your Music's Top Dream Pop Albums](examples/rateyourmusic-top-dreampop-albums.spotify.txt) ([source](examples/rateyourmusic-top-dreampop-albums.txt))
-   [Rate Your Music's Top Shoegaze Albums](examples/rateyourmusic-top-shoegaze-albums.spotify.txt) ([source](examples/rateyourmusic-top-shoegaze-albums.txt))
-   [Rolling Stone's 500 Greatest Songs of All Time](examples/rollingstone-500-greatest-songs-of-all-time.spotify.txt) ([source](examples/rollingstone-500-greatest-songs-of-all-time.txt))

Obtain
------

The source code is located at [GitHub](https://github.com/epsil/spotify-js). To clone the repository:

    $ git clone https://github.com/epsil/spotify-js.git

Alternatively, download a [ZIP file](https://github.com/epsil/spotify-js/archive/master.zip).

The script requires [Node](https://nodejs.org/) to be installed.

Usage
-----

Run the script with `./spotify.js` or `node spotify`:

    $ ./spotify.js input.txt output.txt

`input.txt`:

    Walk in the Park - Beach House
    Irene - Beach House
    Other People - Beach House
    Troublemaker - Beach House
    Wishes - Beach House

`output.txt`:

    spotify:track:4oNXgGnumnu5oIXXyP8StH
    spotify:track:7rAjeWkQM6cLqbPjZtXxl2
    spotify:track:2Nt4Uw91pQLXSJ28SttDdF
    spotify:track:4qbCRlvE5Bb9XNBjxARjoP
    spotify:track:7x4tFmih1JBITx0e2ucGrT

To import the playlist, copy the contents of `output.txt` to the clipboard, create a new playlist in Spotify, and paste into it (with *Edit -> Paste* or <kbd>Ctrl</kbd> + <kbd>V</kbd>).

### Albums

To add an entire album to the playlist, use the `#album` directive:

    #album Substrata - Biosphere

Result:

    spotify:track:1TCkrnjuurf0DNLLoJxVyd
    spotify:track:1vriNGX7VD9Cx0Z2N2IglO
    spotify:track:6RrehqfwNTkuQiWu0WNf3X
    ...

### Artists

To add the entire discography of an artist to the playlist, use the `#artist` directive:

    #artist Beach House

Result:

    spotify:track:2SNGR7tguWgIR7sWzn40bw
    spotify:track:40SNnkhRM3ZUPLOOOEAcoM
    spotify:track:2Fr2fg7o35D5gZObRhragD
    ...

### Order

To order the tracks by Spotify popularity, add the line `#order by popularity`:

    #order by popularity
    #artist Beach House

To order the tracks by [Last.fm](http://last.fm/) playcount, add the line `#order by lastfm`:

    #order by lastfm
    #artist Beach House

### Group

To sort the ordered tracks into groups, use the `#group by` directive:

    #order by lastfm
    #group by album
    #artist Beach House

This will create a Last.fm-ordered playlist where tracks from the same album are grouped together.

### Other tips

See [tips](Tips.md) for more information regarding playlist conversion.

See also
--------

-   [Exportify](https://github.com/watsonbox/exportify), the opposite (export Spotify playlists to CSV format)
-   [last.py](https://github.com/epsil/lastpy), a Python script for sorting playlists by Last.fm rating

### GUI alternatives

Although a command-line script is unsurpassably efficient for processing multiple playlists in batch, a GUI may be simpler to use if one only has a few playlists to import. Here are a couple of free web services:

-   [Yet Another Spotify Playlist Converter](http://michaeldick.me/YetAnotherSpotifyPlaylistConverter/) ([source](https://github.com/bertique/YetAnotherSpotifyPlaylistConverter))
-   [Spotlistr](http://spotlistr.herokuapp.com/) ([source](https://github.com/BobNisco/Spotlistr))
-   [Playlist Converter](http://www.playlist-converter.net/)
