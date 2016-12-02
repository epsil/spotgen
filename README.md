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

To import the playlist, copy the contents of `output.txt` to the clipboard, create a new playlist in Spotify, and paste into it (<kbd>Ctrl</kbd> + <kbd>V</kbd>).

### Tips

Converting multiple playlists at once can easily be done in the Bash shell:

    $ for f in *.txt; do ./spotify.js "$f" "${f%.txt}.spotify"; done

This converts `playlist1.txt`, `playlist2.txt`, `playlist3.txt` to `playlist1.spotify`, `playlist2.spotify`, `playlist3.spotify`.

Furthermore, if your shell supports globbing, then you can recursively convert all playlists in a directory with the `**/*.txt` pattern:

    $ for f in **/*.txt; do ./spotify.js "$f" "${f%.txt}.spotify"; done

See also
--------

-   [Exportify](https://github.com/watsonbox/exportify), the opposite (exports Spotify playlists to CSV format)

### Alternatives

While a command-line script is efficient for processing a large batch of playlists, a GUI may be simpler to use if you only have a few playlists to import. Here are a couple of free web services:

-   [Yet Another Spotify Playlist Converter](http://michaeldick.me/YetAnotherSpotifyPlaylistConverter/) ([source](https://github.com/bertique/YetAnotherSpotifyPlaylistConverter))
-   [Spotlistr](http://spotlistr.herokuapp.com/) ([source](https://github.com/BobNisco/Spotlistr))
-   [Playlist Converter](http://www.playlist-converter.net/)
