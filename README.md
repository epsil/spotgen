[Spotify Playlist Generator](https://epsil.github.io/spotify/)
==============================================================

> A tool for converting, reordering and generating Spotify playlists.
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

To import the playlist into Spotify:

1.  **Copy the output of the generator:** choose *Edit -> Copy* (<kbd>Ctrl</kbd> + <kbd>C</kbd>).
2.  **Create a new playlist in Spotify:** choose *File -> New Playlist* (<kbd>Ctrl</kbd> + <kbd>N</kbd>).
3.  **Paste into the playlist:** select the playlist and choose *Edit -> Paste* (<kbd>Ctrl</kbd> + <kbd>V</kbd>).

### Top tracks

To add the top 10 tracks of an artist:

    #top Aphex Twin

This will create a playlist consisting of ten most popular tracks of Aphex Twin. To add only the top 5 tracks, use `#top5`.

### Similar artists

To add tracks from similar artists:

    #similar Aphex Twin

This will create a playlist consisting of the most popular tracks from the most similar artists to Aphex Twin.

### Artists

To add the entire discography of an artist:

    #artist Beach House

Result:

    spotify:track:<Beach House Track #1>
    spotify:track:<Beach House Track #2>
    spotify:track:<Beach House Track #3>
    ...

### Albums

To add an entire album to the playlist:

    #album Substrata - Biosphere

Result:

    spotify:track:<Substrata Track #1>
    spotify:track:<Substrata Track #2>
    spotify:track:<Substrata Track #3>
    ...

### Order

To order the tracks by Spotify popularity, use `#order by`:

    #order by popularity
    #artist Beach House

To order the tracks by [Last.fm](http://last.fm/) playcount, add the line `#order by lastfm`:

    #order by lastfm
    #artist Beach House

### Group

To sort the ordered tracks into groups, use `#group by`:

    #order by lastfm
    #group by artist
    #similar Beach House

This will create a Last.fm-ordered playlist of artists similar to Beach House, where tracks from the same artists are grouped together.

### Alternate

To group the tracks and then interleave them, use `#alternate by`:

    #order by lastfm
    #alternate by artist
    #similar Beach House

This will create a Last.fm-ordered playlist of artists similar to Beach House, with each track having a different artist from the previous track.

### Tracks

To add a track to the playlist, add a line on the form `TITLE - ARTIST`:

    Walk in the Park - Beach House
    Irene - Beach House
    Other People - Beach House
    Troublemaker - Beach House
    Wishes - Beach House

Result:

    spotify:track:4oNXgGnumnu5oIXXyP8StH
    spotify:track:7rAjeWkQM6cLqbPjZtXxl2
    spotify:track:2Nt4Uw91pQLXSJ28SttDdF
    spotify:track:4qbCRlvE5Bb9XNBjxARjoP
    spotify:track:7x4tFmih1JBITx0e2ucGrT

### Import M3U playlists

One can easily import [M3U](https://en.wikipedia.org/wiki/M3U) playlists (with the file extension `.m3u` or `.m3u8`) provided they contain `EXTM3U` metadata. That is, the playlist should be on the form:

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

The generator will automatically convert this to:

    Desire Lines - Deerhunter
    Saved By Old Times - Deerhunter
    Agoraphobia - Deerhunter
    Revival - Deerhunter
    Twilight at Carbon Lake - Deerhunter

### Import existing Spotify playlists

One can also work with existing Spotify playlists. By selecting the playlist's tracks in Spotify (with *Edit -> Select All* or <kbd>Ctrl</kbd> + <kbd>A</kbd>), copying them (with *Edit -> Copy* or <kbd>Ctrl</kbd> + <kbd>C</kbd>) and pasting them as text elsewhere (with *Edit -> Paste* or <kbd>Ctrl</kbd> + <kbd>V</kbd>), one obtains a list of links:

    https://open.spotify.com/track/4oNXgGnumnu5oIXXyP8StH
    https://open.spotify.com/track/7rAjeWkQM6cLqbPjZtXxl2
    https://open.spotify.com/track/2Nt4Uw91pQLXSJ28SttDdF
    https://open.spotify.com/track/4qbCRlvE5Bb9XNBjxARjoP
    https://open.spotify.com/track/7x4tFmih1JBITx0e2ucGrT

The generator will automatically convert this to:

    spotify:track:4oNXgGnumnu5oIXXyP8StH
    spotify:track:7rAjeWkQM6cLqbPjZtXxl2
    spotify:track:2Nt4Uw91pQLXSJ28SttDdF
    spotify:track:4qbCRlvE5Bb9XNBjxARjoP
    spotify:track:7x4tFmih1JBITx0e2ucGrT

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
