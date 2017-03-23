#!/bin/bash


DATE=$(date "+%d_%m_%Y")
FILENAME="menu_pranzo_${DATE}_16_00.pdf"
FOLDER=8haeeqygx59lzbsn

main() {
        URL="https://docs.google.com/viewerng/viewer?url=${PDF}&usp=sharing"
        ID=$(openssl rand -hex 32)
        JOB_ID=$(openssl rand -hex 5)

        curl -sSLO $PDF > /dev/null
        curl -sS http://pdftotext.com/upload/$FOLDER -F "file=@${FILENAME};type=application/pdf" -F id=$JOB_ID > /dev/null
        curl -sS http://pdftotext.com/convert/$FOLDER/$JOB_ID?rnd=0.16389987427930808 > /dev/null
        sleep 2s
        TEXT=$(curl -s http://pdftotext.com/files/$FOLDER/$JOB_ID/"${FILENAME%.*}.txt")
        TEXT=$(echo -en $TEXT | sed -e 's/[[:space:]]*$//;s/^.*PASTA AL POMODORO.//g;s/ € *[0-9]*[0-9],*\.*[0-9][0-9]//g;s/\. */<br>/g')
        rm $FILENAME

        echo '{
                "color": "green",
                "message": "<a href=\"'$URL'\"><img src=\"'$LOGO'\"><br><br>Menu '$RESTAURANT' del <b>'${DATE//_/-}'</b></a><br><br>'$TEXT'",
                "notify": true,
                "message_format": "html"
        }' | curl -k -X POST $HIPCHAT_URL -H "authorization:Bearer ${HIPCHAT_TOKEN}" -H content-type:application/json -d @-
}

PDF="http://www.cityliferistorante.it/upload/$FILENAME"
RESTAURANT="City Life"
LOGO="http://www.cityliferistorante.it/img/city_logo.png"

main

PDF="http://antaresristorante.it/upload/$FILENAME"
RESTAURANT="Antares"
LOGO="http://antaresristorante.it/images/antares.png"

main

