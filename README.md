# twitch-data-api

API used by [TTV Stats](ttvstats.com). Provides and aggregates historical data gathered from Twitch. Based on Node.js and Express.

#### other twitchdata repositories
* [twitch-data-collector](https://github.com/aeife/twitch-data-collector)
* [twitch-data-client](https://github.com/aeife/twitch-data-client)

### API
At the moment this API is only ment to be used by the twitch-data-client. It delivers information about gathered games, channels and their historical aggregated stats.

### Development
Steps to run this project in a local dev environment

1. ```npm install```

  installs development dependencies

2. ```node server.js```

  starts the server including the API

This projects needs a running database (MongoDB).
