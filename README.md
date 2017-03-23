![](http://antaresristorante.it/images/antares.png)
# antaresbot
Post daily menu to chats

## How do I get set up?
You need to set these env vars based on which chat service you want to use:
* `HIPCHAT_URL`: https://MYORG.hipchat.com/v2/room/MYROOM/notification?auth_token=MYTOKEN
* `SLACK_URL`: https://hooks.slack.com/services/MYSLACKWEBHOOKURL

Then call the script:
```bash
$ bin/antares.sh
```
