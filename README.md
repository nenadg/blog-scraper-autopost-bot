blog-scraper-autopost-bot
============

Node.js bot that scraps wordpress (or any other) blogs gathering article titles, excerpts and links than posts it's finding on twitter.

Use forever npm package to run it in background (or any other conventinal way).

```sh
$ sudo npm -g install forever
$ forever start app.js 
```

## Some considerations
If you run on problems during npm install, try installing node-gyp globally:

```sh
$ sudo npm install -g node-gyp
```

Also make sure you have 'make' package installed on your system (This goes for Linux users).