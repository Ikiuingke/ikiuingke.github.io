# LpEp Finder

This project uses [Google Custom Search](https://cse.google.com/cse/all)

[https://lpepfinder.com](https://lpepfinder.com)

You can find the list of Record stores in `/cse`.

## open search

Open search is setup, see the file `./opensearch.xml` for setup.

## update cse

To update and add cse, it has to be done manually through
[cse.google.com](https://cse.google.com/).

The file in `./cse` can be updated manually, but otherwise, each
change to the database (CRUD a country/region tag, or a record store),
could be done thorugh the interface, and a version downloaded to be
saved in this repo.

## Google ads bygoogle

Are tried on this side, but not working (generating revenue assigne to
the site editors), since it is hosted on a subdomain (and
googleadsbygoogle does not allow that it seems), even in CSE.
