Tips
====

Examples
--------

-   [Pitchfork's 50 Best Albums of 2016](examples/pitchfork-50-best-albums-of-2016.spotify.txt) ([source](examples/pitchfork-50-best-albums-of-2016.txt))
-   [Pitchfork's Honorable Mentions of 2015](examples/pitchfork-honorable-mentions-of-2015.spotify.txt) ([source](examples/pitchfork-honorable-mentions-of-2015.txt))
-   [Pitchfork's 50 Best Ambient Albums of All Time](examples/pitchfork-50-best-ambient-albums-of-all-time.spotify.txt) ([source](examples/pitchfork-50-best-ambient-albums-of-all-time.txt))
-   [Rate Your Music's Top Albums of 2016](examples/rateyourmusic-top-albums-of-2016.spotify.txt) ([source](examples/rateyourmusic-top-albums-of-2016.txt))
-   [Rate Your Music's Top Dream Pop Albums](examples/rateyourmusic-top-dreampop-albums.spotify.txt) ([source](examples/rateyourmusic-top-dreampop-albums.txt))
-   [Rate Your Music's Top Shoegaze Albums](examples/rateyourmusic-top-shoegaze-albums.spotify.txt) ([source](examples/rateyourmusic-top-shoegaze-albums.txt))
-   [Rolling Stone's 500 Greatest Songs of All Time](examples/rollingstone-500-greatest-songs-of-all-time.spotify.txt) ([source](examples/rollingstone-500-greatest-songs-of-all-time.txt))

Audio features
--------------

Spotify collaborates with the [Echo Nest Project](http://the.echonest.com/) and provides algorithmic analysis of all tracks. These "[audio features](https://developer.spotify.com/web-api/get-audio-features/)" can be used to filter existing playlists. For example, to create a melodic playlist out of "Pitchfork's Best New Tracks":

    #order by instrumentalness
    https://open.spotify.com/user/pitchforkmedia/playlist/5ItokEl1f0bbHeXWFiisrm

To create a hip-hop playlist:

    #order by instrumentalness
    #reverse
    https://open.spotify.com/user/pitchforkmedia/playlist/5ItokEl1f0bbHeXWFiisrm

To create a workout playlist:

    #order by energy
    https://open.spotify.com/user/pitchforkmedia/playlist/5ItokEl1f0bbHeXWFiisrm

To create a dancing playlist:

    #order by danceability
    https://open.spotify.com/user/pitchforkmedia/playlist/5ItokEl1f0bbHeXWFiisrm

Last.fm
-------

To create a playlist of a user's recently played tracks:

    http://www.last.fm/user/username/library

To create a playlist of tracks a user has listened to on a particular day:

    http://www.last.fm/user/username/library?from=2012-07-21&to=2013-07-21

To create a playlist of a user's favorite tracks for a given year:

    http://www.last.fm/user/username/library/tracks?from=2012-01-01&to=2013-01-01

To create a playlist of a user's favorite tracks of all time:

    http://www.last.fm/user/username/library/tracks

To create a playlist of a user's loved tracks:

    http://www.last.fm/user/username/loved

To create a playlist of a user's favorite albums:

    http://www.last.fm/user/username/library/albums

To create a playlist of a user's favorite artists:

    http://www.last.fm/user/username/library/artists

To create a playlist of an artist's top tracks:

    http://www.last.fm/music/Artist+Name/+tracks

To create a playlist of artists similar to an artist:

    http://www.last.fm/music/Artist+Name/+similar

Last.fm's webpages are a goldmine of recommendations. For example, if one has a high compatibility with another user, that user's "top tracks" often makes for an interesting playlist.

Similarly, one's own "top tracks" are also a good source of favorites, especially in combination with a time criteria. The "top tracks" chart for an earlier year is a good indication of one's listening habits in that time period, and a rich source of "lost gems" which one may have forgotten about in the meantime.

Last.fm also provides information about an artist's top tracks and similar artists. Such functionality is built into Spotify as well, but Last.fm's recommendations are a good supplement.

Recipes
-------

### Last.fm similar artists, interleaved together

    #alternate by artist
    http://www.last.fm/music/Artist+Name/+similar

### Artist's discography ordered by user's Last.fm rating

    #order by lastfm username
    #artist Beach House

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

    for f in *.txt; do spotgen "$f" "${f%.txt}.spotify.txt"; done

This converts `playlist1.txt`, `playlist2.txt`, `playlist3.txt` to `playlist1.spotify.txt`, `playlist2.spotify.txt`, `playlist3.spotify.txt`.

Furthermore, if the shell supports globbing, then one can recursively convert all playlists in a directory with the `**/*.txt` pattern:

    for f in **/*.txt; do spotgen "$f" "${f%.txt}.spotify.txt"; done

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

Since file name standards vary, the transformation requires some personal judgment; that is why it is not built into the script. (See this [blog post](https://epsil.github.io/blog/2013/11/23/#fn3) for more examples.)

Note that other playlist formats, like [ASX](https://en.wikipedia.org/wiki/Advanced_Stream_Redirector), [PLS](https://en.wikipedia.org/wiki/PLS_%28file_format%29), [WPL](https://en.wikipedia.org/wiki/Windows_Media_Player_Playlist) and [XSPF](https://en.wikipedia.org/wiki/XML_Shareable_Playlist_Format), are difficult to work with directly. Therefore, it is recommended to save to M3U format and proceed as outlined above.

Miscellaneous
-------------

Single tracks should be on the form `Artist - Track`. However, Spotify isn't terribly strict about this; `Track - Artist` also works well, as does a [Spotify search](https://support.spotify.com/us/using_spotify/search_play/advanced-search1/). One can even add [field filters](https://developer.spotify.com/web-api/search-item/).

Links
-----

-   [List of curated playlists](http://www.reddit.com/r/spotify/comments/4lklob/42_awesome_independent_playlist_curators_blogs_me/)
-   [Data Mining: Mental Health as a Function of Music](https://github.com/SunnyShikhar/music-datamining)
