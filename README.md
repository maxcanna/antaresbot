# antaresbot  [![CI Status](https://github.com/maxcanna/antaresbot/workflows/CI/badge.svg)](https://github.com/maxcanna/antaresbot/actions) [![](https://img.shields.io/github/license/maxcanna/antaresbot.svg?maxAge=2592000)](https://github.com/maxcanna/antaresbot/blob/master/LICENSE)
Post daily menu to several media. E.g. [Pushbullet](https://www.pushbullet.com/channel?tag=antares), HipChat, Slack, `stdout`.

## How do I get set up?
You need to set these env vars based on which chat service you want to use:
* **HIPCHAT_URL**: `https://MYORG.hipchat.com/v2/room/MYROOM/notification?auth_token=MYTOKEN`
* **SLACK_URL**: `https://hooks.slack.com/services/MYSLACKWEBHOOKURL`
* **PUSHBULLET_TOKEN**: `8ab92981655adc3b28c2d4ae111fa393`
* **CONSOLE_OUTPUT**: `true`

Then call the script:
```bash
$ bin/antares.sh
```
or use the function exported in `antaresbot.js` like:
```js
$ node -e "require('./antaresbot')().then(process.exit);"
```
