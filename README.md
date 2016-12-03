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

### Tips

The input should be on the form `Track - Artist`. However, Spotify isn't terribly strict about this; `Artist - Track` also works well, as does a Spotify search. One can even add [field filters](https://developer.spotify.com/web-api/search-item/).

#### Multiple playlists

Converting multiple playlists at once can easily be done in the Bash shell:

    $ for f in *.txt; do ./spotify.js "$f" "${f%.txt}.spotify"; done

This converts `playlist1.txt`, `playlist2.txt`, `playlist3.txt` to `playlist1.spotify`, `playlist2.spotify`, `playlist3.spotify`.

Furthermore, if the shell supports globbing, then one can recursively convert all playlists in a directory with the `**/*.txt` pattern:

    $ for f in **/*.txt; do ./spotify.js "$f" "${f%.txt}.spotify"; done

#### M3U playlists

With some search and replace magic, one can use a text editor to convert [M3U](https://en.wikipedia.org/wiki/M3U) playlists (with the file extension `.m3u` or `.m3u8`) to the textual format understood by Spotify. Preferably, the playlist contains `EXTM3U` metadata, like in following example. The regular expression

    %s/^#EXTM3U\n\|^#EXTINF:[0-9]+,\|^[^#].*\n?//g

transforms the playlist

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

to the compatible text file

    Desire Lines - Deerhunter
    Saved By Old Times - Deerhunter
    Agoraphobia - Deerhunter
    Revival - Deerhunter
    Twilight at Carbon Lake - Deerhunter

If the playlist does *not* contain metadata, or if the files are badly tagged, then one can attempt to infer the artist and title from the file names instead. Of course, this presupposes that the files are properly named. For example, the regular expression

    %s/\(^[^\/]+\).*\/[-0-9]*[-. ]*\(.*\)\..*/\2 - \1/g

transforms the playlist

    Beach House/Teen Dream/04 Walk in the Park.mp3
    Beach House/Bloom/10 Irene.mp3
    Beach House/Bloom/04 Other People.mp3
    Beach House/Bloom/06 Troublemaker.mp3
    Beach House/Bloom/08 Wishes.mp3

to the compatible text file

    Walk in the Park - Beach House
    Irene - Beach House
    Other People - Beach House
    Troublemaker - Beach House
    Wishes - Beach House

As can be seen, these transformations require some personal judgment; that is why they are not built into the script. See this [blog post](https://epsil.github.io/2013/11/23/) for more examples.

Other playlist formats, like [ASX](https://en.wikipedia.org/wiki/Advanced_Stream_Redirector), [PLS](https://en.wikipedia.org/wiki/PLS_%28file_format%29), [WPL](https://en.wikipedia.org/wiki/Windows_Media_Player_Playlist) and [XSPF](https://en.wikipedia.org/wiki/XML_Shareable_Playlist_Format), are difficult to work with directly. Therefore, it is recommended to save to M3U format and proceed as outlined above.

See also
--------

-   [Exportify](https://github.com/watsonbox/exportify), the opposite (export Spotify playlists to CSV format)
-   [last.py](https://github.com/epsil/lastpy), a Python script for sorting playlists by Last.fm rating

### GUI alternatives

Although a command-line script is unsurpassably efficient for processing multiple playlists in batch, a GUI may be simpler to use if one only has a few playlists to import. Here are a couple of free web services:

-   [Yet Another Spotify Playlist Converter](http://michaeldick.me/YetAnotherSpotifyPlaylistConverter/) ([source](https://github.com/bertique/YetAnotherSpotifyPlaylistConverter))
-   [Spotlistr](http://spotlistr.herokuapp.com/) ([source](https://github.com/BobNisco/Spotlistr))
-   [Playlist Converter](http://www.playlist-converter.net/)
