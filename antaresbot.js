'use strict';

const FOLDER = '8haeeqygx59lzbsn';
const OCR_URL = `https://pdftotext.com`;
const RESTAURANT_CITY_LIFE = 'CITY_LIFE';
const RESTAURANT_ANTARES = 'ANTARES';

const requestPDF = require('request-promise-native').defaults({ json: true, baseUrl: OCR_URL });
const requestMessages = require('request-promise-native').defaults({ json: true });
const requestRestaurant = require('request').defaults({ encoding: null });
const fileType = require('file-type');

const now = new Date();
const DATE = `${('0'+now.getDate()).slice(-2)}_${(('0'+(now.getMonth()+1)).slice(-2))}_${now.getFullYear()}`;

const RESTAURANT_PARAMETERS = {
    [RESTAURANT_CITY_LIFE]: {
        pdfUrl: 'http://www.cityliferistorante.it/upload/',
        name: 'City Life',
        logo: 'http://www.cityliferistorante.it/img/city_logo.png',
    },
    [RESTAURANT_ANTARES]: {
        pdfUrl: 'http://antaresristorante.it/upload/',
        name: 'Antares',
        logo: 'http://antaresristorante.it/images/antares.png',
    },
};

const getFile = url => new Promise((resolve, reject) => requestRestaurant(url, (err, res, data) => {
    if (err) {
        return reject(err);
    }
    const dataType = fileType(data);

    if (!dataType || dataType.ext !== 'pdf') {
        return reject(new Error('Not pdf'));
    }
    resolve(data);
}));

const getFilename = () => `menu_pranzo_${DATE}_16_00`;
const getRestaurantName = restaurant => RESTAURANT_PARAMETERS[restaurant]['name'];
const getRestaurantLogo = restaurant => RESTAURANT_PARAMETERS[restaurant]['logo'];
const getRestaurantFileUrl = restaurant => `${RESTAURANT_PARAMETERS[restaurant]['pdfUrl']}${getFilename()}.pdf`;
const getShareUrl = pdfUrl => `https://docs.google.com/viewerng/viewer?url=${pdfUrl}&usp=sharing`;

const sendHipchat = (restaurant, text, error = false) => {
    const { env: { HIPCHAT_URL } } = process;
    const PDF_URL = getRestaurantFileUrl(restaurant);
    const NAME = getRestaurantName(restaurant);
    const LOGO = getRestaurantLogo(restaurant);
    const SHARE_URL = getShareUrl(PDF_URL);
    const HUMAN_DATE = DATE.replace(/_/g, '/');

    return HIPCHAT_URL
        ? requestMessages.post(HIPCHAT_URL, {
            body: {
                color: error ? 'red' : 'green',
                message: `<a href=${SHARE_URL}><img src=${LOGO}><br><br>Menu ${NAME} del <b>${HUMAN_DATE}</b></a><br><br>${text.replace('\n', '<br>')}`,
                notify: true,
                message_format: 'html',
            }
        })
        : Promise.resolve();
};

const sendSlack = (restaurant, text, error = false) => {
    const { env: { SLACK_URL } } = process;
    const PDF_URL = getRestaurantFileUrl(restaurant);
    const NAME = getRestaurantName(restaurant);
    const LOGO = getRestaurantLogo(restaurant);
    const SHARE_URL = getShareUrl(PDF_URL);
    const HUMAN_DATE = DATE.replace(/_/g, '/');

    return SLACK_URL
        ? requestMessages.post(SLACK_URL, {
            body: {
                username: NAME,
                icon_url: LOGO,
                attachments: [
                    {
                        text,
                        fallback: `Menu del ${HUMAN_DATE}`,
                        title: `Menu del ${HUMAN_DATE}`,
                        title_link: SHARE_URL,
                        color: error ? 'danger' : 'good',
                        thumb_url: LOGO,
                        author_icon: LOGO,
                        author_name: NAME,
                    }
                ]
            }
        })
        : Promise.resolve();
};

const sendPushbullet = (restaurant, text, error = false) => {
    const { env: { PUSHBULLET_TOKEN } } = process;
    const PDF_URL = getRestaurantFileUrl(restaurant);
    const NAME = getRestaurantName(restaurant);
    const SHARE_URL = getShareUrl(PDF_URL);
    const HUMAN_DATE = DATE.replace(/_/g, '/');

    return PUSHBULLET_TOKEN
        ? requestMessages.post('https://api.pushbullet.com/v2/pushes', {
            body: {
                type: 'link',
                body: text,
                title: `Menu ${NAME} del ${HUMAN_DATE}`,
                url: SHARE_URL,
                channel_tag: 'antares'
            },
            headers: {
                'access-token': PUSHBULLET_TOKEN,
            }
        })
        : Promise.resolve();
};

const getMenu = restaurant => {
    const FILENAME = getFilename();
    const FILENAME_TXT = `${FILENAME}.txt`;
    const FILENAME_PDF = `${FILENAME}.pdf`;
    const PDF_URL = getRestaurantFileUrl(restaurant);
    const JOB_ID = Math.random().toString(16).substring(5);

    return getFile(PDF_URL)
        .then(file => requestPDF.post(`/upload/${FOLDER}`, {
            formData: {
                file: {
                    value: file,
                    options: {
                        filename: FILENAME_PDF,
                        contentType: 'application/pdf'
                    }
                },
                id: JOB_ID,
            }
        }))
        .then(data => {
            console.log(data);
            return requestPDF(`/convert/${FOLDER}/${JOB_ID}`, {
                qs: {
                    rnd: '0.16389987427930808'
                }
            })
        })
        .then(data => {
            console.log(data);
            if (data.status !== 'success') {
                throw new Error('Error during OCR start');
            }
            return new Promise(resolve => setTimeout(resolve, 2000));
        })
        .then(() => requestPDF(`/status/${FOLDER}/${JOB_ID}`))
        .then(data  => {
            console.log(data);
            if (data.status !== 'success') {
                throw new Error('Error during OCR status check');
            }
            return requestPDF(`/files/${FOLDER}/${JOB_ID}/${FILENAME_TXT}`)
        })
        .then(text => text
            .replace(/.*PASTA AL POMODORO\.?$/gsm, '')
            .split('\n')
            .filter(Boolean)
            .filter(row => row.match(/€ *[0-9]*[0-9],*\.*[0-9][0-9]/) === null)
            .filter(row => row.match(/PRIM.*/) === null)
            .filter(row => row.match(/SECOND.*/) === null)
            .filter(row => row.match(/PIATT.*/) === null)
            .filter(row => row.match(/BUON.*/) === null)
            .filter(row => row.match(/Buon.*/) === null)
            .filter(row => row.match(/UNICO.*/) === null)
            .filter(row => row.match(/BIS.*/) === null)
            .filter(row => row.match(/RISO.*INGLESE.*/) === null)
            .map(row => `${row[0]}${row.slice(1).toLowerCase()}`)
            .join('\n')
            .replace(/€.*/, '')
            .replace(/\.\n/g, '\n')
        )
        .then(text => Promise.all([
            sendHipchat(restaurant, text),
            sendSlack(restaurant, text),
            sendPushbullet(restaurant, text),
        ]))
        .catch(e => Promise.all([
            sendHipchat(restaurant, e.message, true),
            sendSlack(restaurant, e.message, true),
            sendPushbullet(restaurant, e.message, true),
        ]));
};

module.exports = (context, cb) => {
    process.env = {
        ...process.env,
        ...context.secrets,
    };
    return Promise.all([RESTAURANT_CITY_LIFE].map(getMenu))
        .then(data => cb(null, data))
        .catch(cb);
};
