[Spotify Playlist Generator](https://epsil.github.io/spotify/)
==============================================================

> A tool for generating Spotify playlists.
>
> <https://epsil.github.io/spotify/>

Examples
--------

-   [Pitchfork's 50 Best Albums of 2016](examples/pitchfork-50-best-albums-of-2016.spotify.txt) ([source](examples/pitchfork-50-best-albums-of-2016.txt))
-   [Pitchfork's Honorable Mentions of 2015](examples/pitchfork-honorable-mentions-of-2015.spotify.txt) ([source](examples/pitchfork-honorable-mentions-of-2015.txt))
-   [Pitchfork's 50 Best Ambient Albums of All Time](examples/pitchfork-50-best-ambient-albums-of-all-time.spotify.txt) ([source](examples/pitchfork-50-best-ambient-albums-of-all-time.txt))
-   [Rate Your Music's Top Albums of 2016](examples/rateyourmusic-top-albums-of-2016.spotify.txt) ([source](examples/rateyourmusic-top-albums-of-2016.txt))
-   [Rate Your Music's Top Dream Pop Albums](examples/rateyourmusic-top-dreampop-albums.spotify.txt) ([source](examples/rateyourmusic-top-dreampop-albums.txt))
-   [Rate Your Music's Top Shoegaze Albums](examples/rateyourmusic-top-shoegaze-albums.spotify.txt) ([source](examples/rateyourmusic-top-shoegaze-albums.txt))
-   [Rolling Stone's 500 Greatest Songs of All Time](examples/rollingstone-500-greatest-songs-of-all-time.spotify.txt) ([source](examples/rollingstone-500-greatest-songs-of-all-time.txt))

Usage
-----

Example input:

    Walk in the Park - Beach House
    Irene - Beach House
    Other People - Beach House
    Troublemaker - Beach House
    Wishes - Beach House

Example output:

    spotify:track:4oNXgGnumnu5oIXXyP8StH
    spotify:track:7rAjeWkQM6cLqbPjZtXxl2
    spotify:track:2Nt4Uw91pQLXSJ28SttDdF
    spotify:track:4qbCRlvE5Bb9XNBjxARjoP
    spotify:track:7x4tFmih1JBITx0e2ucGrT

To import the playlist:

1.  Copy the output to the clipboard (with *Edit -> Copy* or <kbd>Ctrl</kbd> + <kbd>C</kbd>).
2.  Create a new playlist in Spotify (with *File -> New Playlist* or <kbd>Ctrl</kbd> + <kbd>N</kbd>).
3.  Paste into it (with *Edit -> Paste* or <kbd>Ctrl</kbd> + <kbd>V</kbd>).

### Albums

To add an entire album to the playlist, use the `#album` directive:

    #album Substrata - Biosphere

Result:

    spotify:track:<Substrata Track #1>
    spotify:track:<Substrata Track #2>
    spotify:track:<Substrata Track #3>
    ...

### Artists

To add the entire discography of an artist, use the `#artist` directive:

    #artist Beach House

Result:

    spotify:track:<Beach House Track #1>
    spotify:track:<Beach House Track #2>
    spotify:track:<Beach House Track #3>
    ...

### Top tracks

To add the top 10 tracks of an artist, use the `#top` directive:

    #top Aphex Twin

To add only the top 5 tracks, use the `#top5` directive.

### Similar artists

To add tracks from similar artists, use the `#similar` directive:

    #similar Aphex Twin

This will create a playlist consisting of the most popular tracks from the most similar artists to Aphex Twin.

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
    #group by artist
    #similar Beach House

This will create a Last.fm-ordered playlist of artists similar to Beach House, where tracks from the same artists are grouped together.

### Alternate

To group the tracks and then interleave them, use the `#alternate by` directive:

    #order by lastfm
    #alternate by artist
    #similar Beach House

This will create a Last.fm-ordered playlist of artists similar to Beach House, with each track having a different artist from the previous track.

Command-line script
-------------------

A command-line version is also available. It requires [Node](https://nodejs.org/) to be installed.

The source code is located at [GitHub](https://github.com/epsil/spotify-js). To clone the repository:

    $ git clone https://github.com/epsil/spotify-js.git

Alternatively, download a [ZIP file](https://github.com/epsil/spotify-js/archive/master.zip).

Run the script with `./index.js` or `node index`:

    $ ./index.js input.txt output.txt

Links
-----

-   [Web interface](https://epsil.github.io/spotify/)
-   [GitHub repository](https://github.com/epsil/spotify-js)
-   [Developer documentation](https://epsil.github.io/spotify/doc/)
-   [Additional tips](Tips.md)

### See also

-   [Exportify](https://github.com/watsonbox/exportify), the opposite (export Spotify playlists to CSV format)
-   [last.py](https://github.com/epsil/lastpy), a Python script for sorting playlists by Last.fm rating

#### GUI converters

-   [Yet Another Spotify Playlist Converter](http://michaeldick.me/YetAnotherSpotifyPlaylistConverter/) ([source](https://github.com/bertique/YetAnotherSpotifyPlaylistConverter))
-   [Spotlistr](http://spotlistr.herokuapp.com/) ([source](https://github.com/BobNisco/Spotlistr))
-   [Playlist Converter](http://www.playlist-converter.net/)
