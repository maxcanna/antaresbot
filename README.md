![](http://antaresristorante.it/images/antares.png)
# antaresbot [![Build Status](https://travis-ci.org/maxcanna/antaresbot.svg?branch=master)](https://travis-ci.org/maxcanna/antaresbot)
Post daily menu to several media. E.g. [Pushbullet](https://www.pushbullet.com/channel?tag=antares), HipChat, Slack.

## How do I get set up?
You need to set these env vars based on which chat service you want to use:
* **HIPCHAT_URL**: `https://MYORG.hipchat.com/v2/room/MYROOM/notification?auth_token=MYTOKEN`
* **SLACK_URL**: `https://hooks.slack.com/services/MYSLACKWEBHOOKURL`
* **PUSHBULLET_TOKEN**: `8ab92981655adc3b28c2d4ae111fa393`

Then call the script:
```bash
$ bin/antares.sh
```
