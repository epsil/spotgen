Spotify Playlist Converter
==========================

> A command-line script for converting playlists to Spotify format.
>
> Written in JavaScript, requires [Node](https://nodejs.org/).

Usage
-----

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

See [tips](Tips.md) for more information.

See also
--------

-   [Exportify](https://github.com/watsonbox/exportify), the opposite (export Spotify playlists to CSV format)
-   [last.py](https://github.com/epsil/lastpy), a Python script for sorting playlists by Last.fm rating

### GUI alternatives

Although a command-line script is unsurpassably efficient for processing multiple playlists in batch, a GUI may be simpler to use if one only has a few playlists to import. Here are a couple of free web services:

-   [Yet Another Spotify Playlist Converter](http://michaeldick.me/YetAnotherSpotifyPlaylistConverter/) ([source](https://github.com/bertique/YetAnotherSpotifyPlaylistConverter))
-   [Spotlistr](http://spotlistr.herokuapp.com/) ([source](https://github.com/BobNisco/Spotlistr))
-   [Playlist Converter](http://www.playlist-converter.net/)
