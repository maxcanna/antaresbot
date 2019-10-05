![](http://antaresristorante.it/images/antares.png)
# antaresbot  [![CI Status](https://github.com/maxcanna/antaresbot/workflows/CI/badge.svg)](https://github.com/maxcanna/antaresbot/actions) [![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com) [![Scrutinizer](https://img.shields.io/scrutinizer/g/maxcanna/antaresbot.svg)](https://scrutinizer-ci.com/g/maxcanna/antaresbot/) [![](https://img.shields.io/github/license/maxcanna/antaresbot.svg?maxAge=2592000)](https://github.com/maxcanna/antaresbot/blob/master/LICENSE)
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

Alternatively you can deploy it using serverless on your FaaS provider
