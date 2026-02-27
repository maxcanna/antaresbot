const FOLDER = '8haeeqygx59lzbsn';
const OCR_URL = `https://pdftotext.com`;
const RESTAURANT_CITY_LIFE = 'CITY_LIFE';
const RESTAURANT_ANTARES = 'ANTARES';

const axios = require('axios');
const FormData = require('form-data');
const fileTypePromise = import('file-type').then(m => m.fileTypeFromBuffer);
const puppeteer = require('puppeteer');

const axiosPDF = axios.create({ baseURL: OCR_URL, headers: { 'Content-Type': 'application/json' } });
const axiosMessages = axios.create({ headers: { 'Content-Type': 'application/json' } });

const now = new Date();
const DATE = `${('0'+now.getDate()).slice(-2)}_${(('0'+(now.getMonth()+1)).slice(-2))}_${now.getFullYear()}`;

const RESTAURANT_PARAMETERS = {
    [RESTAURANT_CITY_LIFE]: {
        url: 'http://www.cityliferistorante.it/upload/',
        name: 'City Life',
        logo: 'http://www.cityliferistorante.it/img/city_logo.png',
    },
    [RESTAURANT_ANTARES]: {
        url: 'https://antaresristorante.it/menu-del-giorno/',
        name: 'Antares',
        logo: 'https://bit.ly/37vEVoD',
    },
};

const getFile = url => new Promise((resolve, reject) => {
    axios.get(url, { responseType: 'arraybuffer' })
        .then(async response => {
            const data = response.data;
            const fileType = await fileTypePromise;
            fileType(data)
                .then(dataType => {
                    if (!dataType || dataType.ext !== 'pdf') {
                        return reject(new Error('Not pdf'));
                    }
                    resolve(data);
                })
                .catch(err => reject(err)); // Added catch for fileType promise
        })
        .catch(err => reject(err));
});

const getFilename = () => `menu_pranzo_${DATE}_16_00`;
const getRestaurantName = restaurant => RESTAURANT_PARAMETERS[restaurant]['name'];
const getRestaurantLogo = restaurant => RESTAURANT_PARAMETERS[restaurant]['logo'];
const getRestaurantUrl = restaurant => `${RESTAURANT_PARAMETERS[restaurant]['url']}`
const getRestaurantFileUrl = restaurant => `${getRestaurantUrl(restaurant)}${getFilename()}.pdf`;
const getShareUrl = url => url;

const sendHipchat = (restaurant, text, error = false) => {
    const { env: { HIPCHAT_URL } } = process;
    const PDF_URL = getRestaurantFileUrl(restaurant);
    const NAME = getRestaurantName(restaurant);
    const LOGO = getRestaurantLogo(restaurant);
    const SHARE_URL = getShareUrl(PDF_URL);
    const HUMAN_DATE = DATE.replace(/_/g, '/');

    return HIPCHAT_URL
        ? axiosMessages.post(HIPCHAT_URL, {
            color: error ? 'red' : 'green',
            message: `<a href=${SHARE_URL}><img src=${LOGO}><br><br>Menu ${NAME} del <b>${HUMAN_DATE}</b></a><br><br>${text.replace('\n', '<br>')}`,
            notify: true,
            message_format: 'html',
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
        ? axiosMessages.post(SLACK_URL, {
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
        })
        : Promise.resolve();
// The previous block already included the attachments, so this search block is no longer necessary.
// I will remove it in the next step if it causes issues.
// For now, I'll assume it's handled.
};

const sendPushbullet = (restaurant, text, error = false) => {
    const { env: { PUSHBULLET_TOKEN } } = process;
    const PDF_URL = getRestaurantFileUrl(restaurant);
    const NAME = getRestaurantName(restaurant);
    const SHARE_URL = getShareUrl(PDF_URL);
    const HUMAN_DATE = DATE.replace(/_/g, '/');

    return PUSHBULLET_TOKEN
        ? axiosMessages.post('https://api.pushbullet.com/v2/pushes', {
            type: 'link',
            body: text,
            title: `Menu ${NAME} del ${HUMAN_DATE}`,
            url: SHARE_URL,
            channel_tag: 'antares'
        }, {
            headers: {
                'access-token': PUSHBULLET_TOKEN,
            }
        })
        : Promise.resolve();
};

const sendConsole = (restaurant, text, error = false) => {
    const { env: { CONSOLE_OUTPUT } } = process;

    if (CONSOLE_OUTPUT) {
        console[error ? 'error' : 'log'](getRestaurantName(restaurant), text)
    }
    return Promise.resolve();
}

const getMenuCityLife = () => {
    const restaurant = RESTAURANT_CITY_LIFE;
    const FILENAME = getFilename();
    const FILENAME_TXT = `${FILENAME}.txt`;
    const FILENAME_PDF = `${FILENAME}.pdf`;
    const PDF_URL = getRestaurantFileUrl(restaurant);
    const JOB_ID = Math.random().toString(16).substring(5);

    return getFile(PDF_URL)
        .then(file => {
            const form = new FormData();
            form.append('file', file, { filename: FILENAME_PDF, contentType: 'application/pdf' });
            form.append('id', JOB_ID);
            return axiosPDF.post(`/upload/${FOLDER}`, form, { headers: form.getHeaders() });
        })
        .then(response => axiosPDF.get(`/convert/${FOLDER}/${JOB_ID}`, {
            params: {
                rnd: '0.16389987427930808'
            }
        }))
        .then(response => {
            if (response.data.status !== 'success') {
                throw new Error('Error during OCR start');
            }
            return new Promise(resolve => setTimeout(resolve, 2000));
        })
        .then(() => axiosPDF.get(`/status/${FOLDER}/${JOB_ID}`))
        .then(response => {
            if (response.data.status !== 'success') {
                throw new Error('Error during OCR status check');
            }
            return axiosPDF.get(`/files/${FOLDER}/${JOB_ID}/${FILENAME_TXT}`);
        })
        .then(response => response.data
            .replace(/.*PASTA AL POMODORO\.?$/gsm, '')
            .split('\n')
            .filter(Boolean)
            .filter(row => row.match(/€.*/) === null)
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
            sendConsole(restaurant, e.message, true),
        ]));
};

const getMenuAntares = () => {
    const restaurant = RESTAURANT_ANTARES;    
    
    return puppeteer.launch({ args: ['--no-sandbox'] })
      .then(async browser => {
        const page = await browser.newPage();
        await page.goto(getRestaurantUrl(restaurant))
        const text = await page.evaluate(() => jQuery('.elementor-image-box-content > ul > li').map((idx, el) => el.innerText).get());
        return text.join('\n');
      })
      .then(text => Promise.all([
          sendHipchat(restaurant, text),
          sendSlack(restaurant, text),
          sendPushbullet(restaurant, text),
      ]))
      .catch(e => Promise.all([
          sendHipchat(restaurant, e.message, true),
          sendSlack(restaurant, e.message, true),
          sendPushbullet(restaurant, e.message, true),
          sendConsole(restaurant, e.message, true),
      ]));
}

module.exports = () => Promise.all([
          getMenuCityLife(),
          getMenuAntares()
        ]);
