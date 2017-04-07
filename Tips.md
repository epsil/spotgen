Tips
====

Recipes
-------

### Top tracks grouped by artist

    #order by popularity
    #group by entry
    #top ...
    #top ...
    #top ...
    ...

### Top tracks grouped by artist, ordered by Last.fm rating

    #order by lastfm
    #group by entry
    #top ...
    #top ...
    #top ...
    ...

### Albums ordered by Last.fm rating

    #order by lastfm
    #group by entry
    #album ...
    #album ...
    #album ...
    ...

### First track from each album

    #alternate by album
    #album ...
    #album ...
    #album ...
    ...

### Similar music to multiple artists

    #order by popularity
    #alternate by artist
    #similar ...
    #similar ...
    #similar ...
    ...

### Similar music to multiple artists, ordered by Last.fm rating

    #order by lastfm
    #alternate by artist
    #similar ...
    #similar ...
    #similar ...
    ...

Multiple playlists
------------------

Converting multiple playlists at once can easily be done in the Bash shell:

    $ for f in *.txt; do ./index.js "$f" "${f%.txt}.spotify.txt"; done

This converts `playlist1.txt`, `playlist2.txt`, `playlist3.txt` to `playlist1.spotify.txt`, `playlist2.spotify.txt`, `playlist3.spotify.txt`.

Furthermore, if the shell supports globbing, then one can recursively convert all playlists in a directory with the `**/*.txt` pattern:

    $ for f in **/*.txt; do ./index.js "$f" "${f%.txt}.spotify.txt"; done

M3U playlists
-------------

One can easily import [extended M3U](https://en.wikipedia.org/wiki/M3U) playlists containing `EXTM3U` metadata. If the playlist does *not* contain metadata (or if the files are badly tagged), however, then one can attempt to infer the title and artist from the file paths instead. To do this, open the playlist in a text editor and use regular expressions to transform it. For example, the regular expression

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

Since file name standards vary, the transformation requires some personal judgment; that is why it is not built into the script. See this [blog post](https://epsil.github.io/blog/2013/11/23/) for more examples.

Note that other playlist formats, like [ASX](https://en.wikipedia.org/wiki/Advanced_Stream_Redirector), [PLS](https://en.wikipedia.org/wiki/PLS_%28file_format%29), [WPL](https://en.wikipedia.org/wiki/Windows_Media_Player_Playlist) and [XSPF](https://en.wikipedia.org/wiki/XML_Shareable_Playlist_Format), are difficult to work with directly. Therefore, it is recommended to save to M3U format and proceed as outlined above.

Miscellaneous
-------------

Single tracks should be on the form `Track - Artist`. However, Spotify isn't terribly strict about this; `Artist - Track` also works well, as does a [Spotify search](https://support.spotify.com/us/using_spotify/search_play/advanced-search1/). One can even add [field filters](https://developer.spotify.com/web-api/search-item/).
