require('dotenv').config({path:'./env.flowerarchitect'});
const moment = require('moment')
  , aws = require("aws-sdk")
  , config = require('./config/config')
  , schedule = require('node-schedule')
  , sqs = new aws.SQS({apiVersion: "2012-11-05"})
  , utils = require('./lib/utils')
  , kms = new aws.KMS()
  , dir = require('node-dir')
  , fs = require('fs-extended')
  , fsx = require('fs.extra')
  , im = require('imagemagick')
  , Canvas = require('canvas')
  , printables = require('./controllers/printables')
  , zf = require('./controllers/JSZenFolio');

var rule = new schedule.RecurrenceRule();

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
    console.log("execute schedule");
  } else {
    console.log("Enlargement Processing");
  }




});
