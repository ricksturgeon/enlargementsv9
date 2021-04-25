/*
 *  config.js in /config
 *
 * @version   $id$ V1.0
 * @package     FlowerArchitect
 * @subpackage  app
 * @author      Sealogix Corp Developer
 * @copyright Copyright (C) 2009 - 2017  Sealogix Corp. All rights reserved.
 * @Patent Pending US 14212028
 * @link http://FlowerArchitect.com
 * This Software is for Sealogix internal use only and
 * is not intended for sale, free sharing or any other re-distribution.
 * Viloaters will be prosecuted!!
 *
 */

var path = require('path')
    , rootPath = path.normalize(__dirname + '/..')
    , templatePath = path.normalize(__dirname + '/../app/mailer/templates')
    , notifier = {
        service: 'postmark',
        APN: false,
        email: false, // true
        actions: ['comment'],
        tplPath: templatePath,
        key: 'POSTMARK_KEY',
        parseAppId: 'PARSE_APP_ID',
        parseApiKey: 'PARSE_MASTER_KEY'
    }

module.exports = {
    enlargementProcessing: false,
    directorys: '',
    myProcessorId:'RicksMac',
    //myRootDir: '/Users/ricksturgeon/clubs/arrangerV2/',
    //myRootDir: '/home/ubuntu/arrangerGit/app/arrangerGitRepo/',
    // myRootDir: '/home/ricksturgeon5/flowerarchitect.com/',
    developmentRootDir: '/Users/ricksturgeon/arrangerV7/arrangerV7.1/',
    productionRootDir: '/home/ricksturgeon5/flowerarchitect.com/',
    wkhtmltopdfResulution: 200,
    // myRootDir: '/Users/ricksturgeon/arrangerV7/arrangerV7.1/',
    myRootDir: rootPath + '/',
    flowerArchitect_api: 'YZOZS313VU910NPXFBHYD', // update with Joomla Key
    joomlaApp_api: 'YOZS313VU910NPXFBHYC', // example SA9WIXGN1320X8O4J44E
    joomlaRootUrl: "http://localhost:8888/",
    joomlaROOTUrlHttp: "localhost",  // flowerarchitect.club  for production, localhost for testing
    nodeMailerEmail: "flowerarchitect@gmail.com",
    emailsPath: "local", // schedule, local, url
    emailsURL: "localhost:3000/email", // change this once server setup
    email_api: 'SA9WICTU9N@O4J44ERYX3', // change this once server setup
    base_url: "./",
    scheduleRule: '10 * * * * *',
    enlargementsPath: 'schedule', // local, schedule, url
    enlargementInProgress: false,
    enlargementsURL: "localhost:3000/enlargement",  // change this once server setup
    enlargement_api: 'SA9WICTU9N@O4J44ERYX3', // change this once server setup
    tempImgUrl: "http://localhost:8000/tmpImg",
    adminUsers: [
        'phidelt',
        'jeannine',
        'rsturgeon'
    ],
    puzzleGallerys: {
      dlv1: '841987903',
      dlv2: '734703481',
      dlv3: '722062054',
      dlv4: '1056464471',
      dlv5: '975422966'
    },

    // myRootDir: '/home/ubuntu/arrangerGit/app/arrangerGitRepo/',
    // Root Folder Setting in Zenfolio
    rootZenfolio: '851257442',
    // Zenfolio IDs where shared photos are stored by month,
    sharedZenfolio: {
        // 2017 shared photos
        1: '1054124343', // January
        2: '404671616', //February
        3: '1518199', // March
        4: '194713714', // April
        5: '526580001', // May
        6: '119842605', // June
        7: '197915295', // July
        8: '292487988', // August
        9: '18862146', // September
        10: '144601392', // October
        11: '139274990', // November
        12: '312092931' // December
    },
    sampleArrangementsUsrId: '589771e015ddfe0e2c182902',
    loadArrangerId: '',
    sampleBasketsId: '',
    useZenfolio: false,
    useAmazon: false,  // RMS .todo add to site
    useDreamhost: false, // RMS .todo add to site
    useLocalhost: true, // RMS .todo add to site
    max_image_size: 1000000,
    max_user_directory_size: 10000000,
    maxRetrys: 3,
    scalingFactor: 24,   // pixels per inch for normilazation used with printables
    tszDefault: 'z05', // default flower thumbnail size
    nszDefault: 'z10', // default flower used for arrangement size
    fszDefault: 'z25', // default flower used for arrangement size
    bszDefault: 'z35', // default sample basket pallet size
    zfsetup: {
        loginName: 'flowerarchitect',
        password: '@2lexAndriP',
        appName: "Flower Architect"
    },
    languagesNames = {
        "Arabic" : "ar",
        "Chinese": "zh",
        "Danish": "da",
        "Dutch": "nl",
        "English": "en",
        "Finnish": "fi",
        "French": "fr",
        "German": "de",
        "Hindi": "hi",
        "Italian": "it",
        "Japanese": "ja",
        "Korean": "ko",
        "Pakistan": "ur",
        "Polish": "pl",
        "Portuguese": "pt",
        "Russian": "ru",
        "Spanish": "es",
        "Vietnamese": "vn"
    },
    languagesCodes = {
        "ar": "Arabic",
        "zh": "Chinese",
        "da": "Danish",
        "nl": "Dutch",
        "en": "English",
        "fi": "Finnish",
        "fr": "French",
        "de": "German",
        "hi": "Hindi",
        "it": "Italian",
        "ja": "Japanese",
        "ko": "Korean",
        "ur": "Pakistan",
        "pl": "Polish",
        "pt": "Portuguese",
        "ru": "Russian",
        "es": "Spanish",
        "vn": "Vietnamese"
    }
}
