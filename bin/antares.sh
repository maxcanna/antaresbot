#!/bin/bash

DATE=$(date "+%d_%m_%Y")
FILENAME="menu_pranzo_${DATE}_16_00.pdf"
FOLDER=8haeeqygx59lzbsn

main() {
    URL="https://docs.google.com/viewerng/viewer?url=${PDF}&usp=sharing"
    ID=$(openssl rand -hex 32)
    JOB_ID=$(openssl rand -hex 5)

    curl -sSLO $PDF > /dev/null
        if [ ! -f $FILENAME ]; then
			echo "${RESTAURANT} menu not found!"
			return 1
		fi
        curl -sS http://pdftotext.com/upload/$FOLDER -F "file=@${FILENAME};type=application/pdf" -F id=$JOB_ID > /dev/null
        curl -sS http://pdftotext.com/convert/$FOLDER/$JOB_ID?rnd=0.16389987427930808 > /dev/null
        sleep 2s
        TEXT=$(curl -s http://pdftotext.com/files/$FOLDER/$JOB_ID/"${FILENAME%.*}.txt")
        TEXT=$(echo -en $TEXT | sed -e 's/[[:space:]]*$//;s/^.*PASTA AL POMODORO.//g;s/ € *[0-9]*[0-9],*\.*[0-9][0-9]//g;s/\. */<br>/g')
    rm $FILENAME

    if [ -n "$HIPCHAT_URL" ]; then
        echo '{
                "color": "green",
                "message": "<a href=\"'$URL'\"><img src=\"'$LOGO'\"><br><br>Menu '$RESTAURANT' del <b>'${DATE//_/-}'</b></a><br><br>'$TEXT'",
                "notify": true,
                "message_format": "html"
        }' | curl -k -X POST $HIPCHAT_URL -H content-type:application/json -d @-
    fi
    if [ -n "$SLACK_URL" ]; then
        echo '{
                "attachments": [
                    {
                        "text": "'${TEXT//<br>/\\n}'",
                        "fallback": "Menu del '${DATE//_/-}'",
                        "title": "Menu del '${DATE//_/-}'",
                        "title_link": "'$URL'",
                        "color": "good",
                        "thumb_url": "'$LOGO'",
                        "author_icon": "'$LOGO'",
                        "author_name": "'$RESTAURANT'"
                    }
                ]
        }' | curl -k -X POST $SLACK_URL -H content-type:application/json -d @-
    fi
}

PDF="http://www.cityliferistorante.it/upload/$FILENAME"
RESTAURANT="City Life"
LOGO="http://www.cityliferistorante.it/img/city_logo.png"

main

PDF="http://antaresristorante.it/upload/$FILENAME"
RESTAURANT="Antares"
LOGO="http://antaresristorante.it/images/antares.png"

main
