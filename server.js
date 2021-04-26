require('dotenv').config({path:'./env.flowerarchitect'});
const moment = require('moment')
  , AWS = require("aws-sdk")
  , config = require('./config/config')
  , schedule = require('node-schedule')
  , sqs = new AWS.SQS({apiVersion: "2012-11-05"})
  , utils = require('./lib/utils')
  , kms = new AWS.KMS()
  , dir = require('node-dir')
  , fs = require('fs-extended')
  , fsx = require('fs.extra')
  , im = require('imagemagick')
  , Canvas = require('canvas')
  , printables = require('./controllers/printables')
  , zf = require('./controllers/JSZenFolio');

var rule = new schedule.RecurrenceRule();
// Create an SQS service object
const queueUrl = "SQS_QUEUE_URL";

//rule.minute = 40;
// rule.second = 10;
// var currentSchedule = schedule.scheduleJob(rule, function(){
//   console.log("execute schedule");
// });

var k = schedule.scheduleJob(config.scheduleRule, function () {
//         *    *    *    *    *    *
//         ┬    ┬    ┬    ┬    ┬    ┬
//         │    │    │    │    │    |
//         │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
//         │    │    │    │    └───── month (1 - 12)
//         │    │    │    └────────── day of month (1 - 31)
//         │    │    └─────────────── hour (0 - 23)
//         │    └──────────────────── minute (0 - 59)
//         └───────────────────────── second (0 - 59, OPTIONAL)
  if(config.enlargementProcessing === false) {
    // printables.processPrintables(req, res);
    // resp = SQS.send_message(QueueUrl=flw_config.flw_enlargements_que_url, MessageBody = datePackage, MessageGroupId="enlargements", MessageDeduplicationId="arrangementId")
    printables.processPrintables();
    console.log("execute schedule");
  } else {
    console.log("Enlargement Processing");
  }




});

// arr = {
//   "des": arrangementData['des'],
//   "dpi": arrangementData['dpi'],
//   "flw": arrangementData['flw'],
//   "img": arrangementData['img'],
//   "las": arrangementData['las'],
//   "rev": arrangementData['rev'],
//   "sto": arrangementData['sto'],
//   "tmb": arrangementData['tmb'],
//   "tit": arrangementData['tit'],
//   "usr": userId,
//   "ver": arrangementData['ver'],
//   "imageSize": '5X8',
//   'targetDPI': normalEnlargementDPI
// }

// variables = {
//   "aid": arrangementId,
//   "arr": json.dumps(arr),
//   // "cre": date.today(),
//   "dpi": flowerDpi,
//   "eml": json.dumps (
//       {
//         "to": userData['encrypted_email'],
//         "cc": "",
//         "bc": ""
//       }
//   ),
//   "job": "arr_enl",
//   "lan": lang,
//   "siz": imageSize,
//   "tit": arrangementData['tit'],
//   "usr": userId
// };
