Spotify Playlist Converter
==========================

> Convert playlists to Spotify format.
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

To import the playlist, copy the contents of `output.txt` to the clipboard, create a new playlist in Spotify, and paste into it.

### Tips

Converting multiple playlists at once can easily be done in the Bash shell. For example, to convert `playlist1.m3u`, `playlist2.m3u`, `playlist3.m3u` to `playlist1.txt`, `playlist2.txt`, `playlist3.txt`, run the following Bash command:

    $ for f in *.m3u; do ./spotify.js "$f" "${f%.m3u}.txt"; done

Alternatives
------------

-   [Yet Another Spotify Playlist Converter](http://michaeldick.me/YetAnotherSpotifyPlaylistConverter/) ([source](https://github.com/bertique/YetAnotherSpotifyPlaylistConverter))
-   [Spotlistr](http://spotlistr.herokuapp.com/) ([source](https://github.com/BobNisco/Spotlistr))
-   [Playlist Converter](http://www.playlist-converter.net/)
