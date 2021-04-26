/*
 *  printables.js in FlowerArchitect/printables/app/arranger/controllers
 *
 * @version   $id$ V1.0
 * @package     FlowerArchitect
 * @subpackage  app
 * @author      Sealogix Corp Developer
 * @copyright Copyright (C) 2009 - 2017 Sealogix Corp. All rights reserved.
 * @Patent Pending US 14212028
 * @link http://FlowerArchitect.com
 * This Software is for Sealogix internal use only and
 * is not intended for sale, free sharing or any other re-distribution.
 * Viloaters will be prosecuted!!
 *
 */

/**
 * Module dependencies.
 */

/*

 Maximum file size

 This refers to the maximum size of any one file that can be uploaded to your account. For Starter subscribers, the maximum file size is 36 Megabytes (36MB). For Pro and Advanced subscribers the maximum file size is 64 Megabytes (64MB). For more information on subscription plans view the Pricing page.

 All subscribers can upload digital photographs with dimensions of up to 30,000 x 30,000 pixels as long as the total actual file size (64MB or 32MB) is within the range of their subscription plan.  If the image is larger that 30,000 pixels on either side, the upload will fail.


 Plan 	Total Maximum Storage for Supported Image files (jpeg, tiff, PNG, GIF) 	Maximum File Size per Image 	Maximum Pixel Dimensions per Image

 Pro, Advanced, Premium, Premium Business and Millers Storefront 	Unlimited 	64 Megabytes (64MB) 	30,000 X 30,000

 */


const moment = require('moment')
  , AWS = require("aws-sdk")
  , ses = new AWS.SES({ region: process.env.AWS_Region })
  , config = require('../config/config')
  // , async = require('async')
  , schedule = require('node-schedule')
  // , request = require('request')
  , sqs = new AWS.SQS({ apiVersion: "2012-11-05" })
  , utils = require('../lib/utils')
  , kms = new AWS.KMS()
  , pg = require('pg')
  , awsS3 = new AWS.S3()
  // , extend = require('util')._extend
  // , ObjectId = require('mongoose').Types.ObjectId
  , dir = require('node-dir')
  , fs = require('fs-extended')
  , fsx = require('fs.extra')
  , im = require('imagemagick')
  , Canvas = require('canvas')
  , zf = require('./JSZenFolio');

var Image = Canvas.Image
  , canvas = ''
  , ctx = ''
  , canvas_img = []
  , imageCount = 0
  , mageLoadedCounter = 0;

// Set your region for future requests.
AWS.config.region = process.env.aws_region;

var zfsetup = {
  loginName: process.env.Zenfolio_loginName
  , password: process.env.password
  , appName: process.env.appName
};


var calltype = 'scheduler'
  , rootZenfolio = process.env.rootZenfolio
  , rootUrl = ''
  , minimum_x = 0
  , minimum_y = 0
  , max_image_width = 1
  , max_image_height = 1
  , imageBorder = 1000 // 600
  , scaleRatio = 1
  , resizeRatio = 1
  , maxCanvasWidth = 10000
  , maxCanvasHeight = 10000
  , maxImageResizeWidth = 10000
  , maxMegabytesTemp72 = 15
  , canvas = ''
  , ctx = ''
  , canvas_width = 0
  , canvas_height = 0
  , photoDPI = 72  // why not 72? vs 95
  , position = ''
  , imageSizeName = ''
  , count = 0
  , MaxDaysToFail = 3
  , CheckedOutTooLongMinutes = 10  // could be 15
  , RetryMinutes = 30
  , ailedRequestList = []
  , sqlResult = []
  , errorValue = '';

// get users email and zenfolio data
var su = "SELECT "
su += "json_build_object( "
su += "'_id', _id, 'encrypted_email', encrypted_email, 'gal' jsonb(gal), 'lang', lang, 'zen' jsonb(zen) "
su += ") AS userData "
su += "FROM "
su += "users "
su += "WHERE _id = %(userId)s "

var s1 = "SELECT "
s1 += "json_build_object("
s1 += "'_id', _id, 'des': des, 'dpi': dpi,  'parentid': parentid, 'flw': jsonb['flw'], 'img', img, 'las', las, 'rev': rev, 'sam', sam, 'sto', sto 'tit': tit, 'tmb', tmb, 'typ': typ, 'sam': sam, 'usr': usr, 'ver': ver, 'zen': zen "
s1 += ") AS arrangement "
s1 += "FROM "
s1 += "arrangement  "
s1 += "WHERE _id = %(arrangementId)s "

var s2 = "DELETE "
s2 += "FROM scheduler "
s2 += "WHERE "
s2 += "_id = %(schedulerId)s"

var s3 = "SELECT "
s3 += "json_build_object("
s3 += "'_id', _id, 'cam', cam, 'cat', cat, 'col', col, 'imh', imh, 'imw', imw, 'mas', mas, 'nam', nam, 'prf', prf, 'tun', tun "
s3 += ") AS data "
s3 += "FROM "
s3 += "flower "
s3 += "WHERE "
s3 += "_id = IN (  %(flowerIds)s  ) "

// update user zenfolio info
var s4 = "UPDATE "
s4 += "users "
s4 += "SET zen = %(zenData)s "
s4 += "where usr = %(userId)s "

var s5 = "UPDATE "
s5 += "users ( "
s5 += "SET "
s5 += "gal = "
s5 += "CASE "
s5 += " WHEN gal IS NULL THEN '[]'::JSONB"
s5 += " ELSE gal"
s5 += "END"
s5 += " || %(galData)s"
s5 += "where _id = %(userId)s"

var s6 = "INSERT INTO enlargements ( "
s6 += " aid, arr, cre, dpi, eml, gid, hrl, job, lan, las, nam, pid, pub, rty, sta, tit, usr, zrl)"
s6 += "VALUES ("
s6 += "%(aid)s, %(arr)s, %(cre)s, %(dpi)s, %(eml)s, %(gid)s, %(hrl)s, %(job)s, %(lan)s, %(las)s, %(nam)s, %(pub)s, %(rty)s, %(sta)s, %(tit)s, %(usr)s, %(zrl)s "
s6 += ")"
// add err if needed 

var s7 = "SELECT "
s7 += "json_build_object("
s7 += "'_id', _id, 'aid': aid, 'arr': jsonb(arr), 'cre': cre, 'dpi': dpi, 'eml': jsonb(eml), 'job': job, 'lan': lan, 'siz': siz, 'tit': tit, 'usr': usr "
s7 += ") AS data "
s7 += "FROM "
s7 += "scheduler "
s7 += "WHERE "
s7 += "job = 'enl' "
s7 += "AND cre = ( SELECT MIN(cre) FROM scheduler ) "


function decryptEncodedstring(encoded) {

  const paramsDecrypt = kms.DecryptRequest = {
    CiphertextBlob: Buffer.from(encoded, 'base64')
  };

  const decryptResult = kms.decrypt(paramsDecrypt);
  if (Buffer.isBuffer(decryptResult.Plaintext)) {
    var result = Buffer.from(decryptResult.Plaintext).toString();
    console.log(result);
    return result
  } else {
    throw new Error('We have a problem');
  }
}

const pool = new pg.Pool({
  host: process.env.db_host,
  port: process.env.db_port,
  user: process.env.db_user,
  database: process.env.db_name,
  password: decryptEncodedstring(process.env.db_pass)
});

function execteSQL(query) {
  sqlResult = [];
  pool.connect((err, client, done) => {
    if (err) throw err;
    client.query(query, (err, res) => {
      done();
      if (err) {
        console.log(err.stack);
      } else {
        for (let row of res.rows) {
          console.log(row);
          sqlResult.push(row);
        }
      }
    });
  });
};

function deleteQueMessage(data) {
  const deleteParams = {
    QueueUrl: queueUrl,
    ReceiptHandle: data.Messages[0].ReceiptHandle
  };
  sqs.deleteMessage(deleteParams, (err, data) => {
    if (err) {
      console.log(err, err.stack);
    } else {
      console.log('Successfully deleted message from queue');
      checkMessages();
    }
  });
}

function checkMessages() {
  // Replace with your accountid and the queue name you setup
  const accountId = process.env.sqs_senderId;
  const queueName = process.env.flw_enlargements_que_name;
  const queueUrl = process.env.flw_enlargements_que_url;
  // Setup the receiveMessage parameters
  const params = {
    QueueUrl: queueUrl,
    MaxNumberOfMessages: 1,
    VisibilityTimeout: 0,
    WaitTimeSeconds: 0
  };

  sqs.receiveMessage(params, (err, data) => {
    if (err) {
      console.log(err, err.stack);
    } else {
      if (!data.Message) {
        console.log('Nothing to process');
        config.enlargementProcessing = false;
        return;
      }
      var inputData = JSON.parse(data.Messages[0].Body);
      config.enlargementProcessing = true;
      console.log('Enlargement request received', enlargementData);
      createEnlargement(inputData);
    }
  });
};


// update arrangements
function updateArrangement(arrangement, input) {

  Arrangement.update({ _id: arrangement._id }, {
    $set: {
      hrl: arrangement.hrl,
      zUrl: arrangement.zUrl,
      gId: arrangement.gId,
      pId: arrangement.pId

    }
  }, function (err) {
    if (err) {
      utils.errLog(req, res, 'printables.updateArrangement.1', err, true);
    } else {
      input.aId = arrangement._id,
        input.zUrl = arrangement.zUrl,
        input.tit = arrangement.tit,
        input.galleryUrl = arrangement.galleryUrl,
        input.sub = i18n.__('A_NEW_FLOWER_ARCHITECT_ENLARGEMENT') + arrangement.tit + i18n.__('HAS_BEEN_ADDED_TO_YOUR_GALLERY');
      sendEmail(input, 'COMPLETED'); // send URL with link to customer
    }
  });
};

function uploadImageToZenfolio(arrangement, galleryId, tempPrintFile) {

  if (arrangement.puz) {
    switch (arrangement.dlv) {
      case 1:
        galleryId = config.puzzleGallerys.dlv1;
        break;
      case 2:
        galleryId = config.puzzleGallerys.dlv2;
        break;
      case 3:
        galleryId = config.puzzleGallerys.dlv3;
        break;
      case 4:
        galleryId = config.puzzleGallerys.dlv4;
        break;
      case 5:
        galleryId = config.puzzleGallerys.dlv5;
        break;
    }
  }
  arrangement.galleryUrl = 'http://www.flowerarchitect.net/' + galleryId;
  //send to zenfolio
  var uploadURL = 'http://up.zenfolio.com/flowerarchitect/p' + galleryId + '/upload2.ushx';
  zf.executeCommands(req, res, config.zfsetup, function (client) {
    zf.upload(req, res, uploadURL, tempPrintFile, function (err, result, photoId) {
      if (err) {
        config.enlargementProcessing = false;
        if (calltype == 'scheduler') {
          Scheduler.update({ aId: input.aId }, {
            $set: {
              sta: 2,
              las: new Date(),
              err: err
            }
          }, function (err) {
            if (err) {
              utils.errLog(req, res, 'printables.placeFlowerCreate.1', err, true);
            } else {
              return false;
            }
          });// Status of job  0 = ready to execute, 1 = checked out, 2 = failed ready to retry, 3 =  completed, 5 = Failed and Refunded
        } else {
          res.send({ success: false, err: err });
        }
      } else {
        arrangement.pId = photoId;
        arrangement.gId = galleryId;
        if (!arrangement.puz) {
          // .todo comment this to save enlargements on local disk
          // fs.unlink(tempPrintFile, function (err) {
          //   if (err) {
          //     utils.errLog(req, res, 'arrangements.placeFlowerCreate.2', err, false);
          //   }
          // });
        }


        // get photo url
        var args = {
          'photoId': photoId,
          updater: {
            'Title': arrangement.tit,
            'Copyright': 'Copyright 2017 Sealogix Corp., All Rights Reserved',
            'Caption': '"Flower Puzzles" game Difficulty Level "' + arrangement.dlv + '" Number "' + arrangement.ord + '" puzzle. Play the "Flower Puzzles" game on your phone. Download "Flower Puzzles" from the "Apple Store" or "Google Play"." To make this Image come to life! Go to the "FlowerArchitect.com" web site and use this arrangement as a base for your own floral design. Click:   http://flowerarchitect.com/arranger/' + arrangement._id + '   in your web browser and begin making your own Virtual Floral Arrangements from our library of thousands of virtual flowers. Have Fun!'
          }
        };

        client.UpdatePhoto(args, function (err, result) {
          if (err) {
            if (calltype == 'scheduler') {
              config.enlargementProcessing = false;
              Scheduler.update({ aId: input.aId }, {
                $set: {
                  sta: 2,
                  las: new Date(),
                  err: err
                }
              }, function (err) {
                if (err) {
                  utils.errLog(req, res, 'printables.placeFlowerCreate.3', err, true);
                } else {
                  return false;
                }
              });// Status of job  0 = ready to execute, 1 = checked out, 2 = failed ready to retry, 3 =  completed, 5 = Failed and Refunded
            } else {
              console.log('upload failed');
              res.send({ success: false, err: err });
            }
          } else {
            var n = result.UpdatePhotoResult.OriginalUrl.indexOf('/img/');
            var m = result.UpdatePhotoResult.OriginalUrl.indexOf('.png');
            arrangement.sto = 'zen';
            arrangement.tmb = result.UpdatePhotoResult.OriginalUrl.substr(n + 5, m - (n + 5)) + '-10';
            arrangement.img = result.UpdatePhotoResult.OriginalUrl.substr(n + 5, m - (n + 5));
            if (config.useAmazon) {
              arrangement.lrl = config.aUrl + arrangement.img + '.png';  // RMS convert to google short this is not good practice but for emergency
            } else if (config.useDreamhost) {
              arrangement.lrl = config.dreamhostUrl + arrangement.img + '.png';  // RMS convert to google short this is not good practice but for emergency
            } else if (config.useLocalhost) {
              arrangement.lrl = config.localUrl + arrangement.img + '.png';  // RMS convert to google short this is not good practice but for emergency
            } else {
              utils.errLog(req, res, 'printables.placeFlowerCreate.4', 'Not Config path selected, make userAmazon, useDreamhost, or userLocalhost true', false);
            }
            arrangement.hrl = result.UpdatePhotoResult.OriginalUrl;
            arrangement.zUrl = result.UpdatePhotoResult.PageUrl;
            // var n = result.UpdatePhotoResult.OriginalUrl.indexOf('/img/');
            // var m = result.UpdatePhotoResult.OriginalUrl.indexOf('.png');

            // get shortend URL from Google

            // var params = {
            //   longUrl: result.UpdatePhotoResult.OriginalUrl,
            //   auth: secrets.googleAPIKey
            // };
            // arrangement.hrl = result.UpdatePhotoResult.OriginalUrl;  // default value
            // get the long url of a shortened url
            // urlshortener.url.insert(params, function (err, response) {
            //     if (err) {
            //         utils.errLog(req, res, 'arrangements.placeFlowerCreate.7', err, false);
            //     } else {
            //         if (response.id) {
            //             arrangement.hrl = response.id;
            //         } else {
            //             arrangement.hrl = result.UpdatePhotoResult.OriginalUrl;
            //         }
            //     }

            // var newArrangement = new Arrangement({
            //   usr: ObjectId(input.usr),
            //   parentId: parentId,
            //   tit: arrangement.tit,
            //   gId: galleryId, // gallery Id image stored in
            //   pId: photoId, // photo ID of i,age from zenfolio
            //   des: arrangement.des,
            //   dpi: arrangement.dpi,
            //   flw: '',
            //   img: result.UpdatePhotoResult.OriginalUrl.substr(n + 5, m - (n + 5)),
            //   typ: 'print',
            //   tmb: result.UpdatePhotoResult.OriginalUrl.substr(n + 5, m - (n + 5)) + '-10',
            //   rev: utils.nextRevision(arrangement.rev), // RMS make A to B, Z to AA, AZ to BA etc
            //   puz: arrangement.puz,
            //   dlv: arrangement.dlv,
            //   ver: 1,
            //   hrl: arrangement.hrl,
            //   originalId: arrangement._id,
            //   pub: new Date()
            // });
            // newArrangement.save(function (err, newArrangement1) {
            //   if (err) {
            //     if (calltype == 'scheduler') {
            //       Scheduler.update({aId: arrangementId}, {
            //         $set: {
            //           sta: 0,
            //           las: new Date(),
            //           err: err
            //         }
            //       }); // Status of job  0 = ready to execute, 1 = checked out, 2 = failed ready to retry, 3 =  completed, 5 = Failed and Refunded
            //     } else {
            //       res.send({success: false, err: err});
            //     }
            //   } else {
            //     // update original arrangement
            //     arrangement.rev = newArrangement1.rev;
            //     arrangement.ver = newArrangement1.ver;
            //     arrangement.hrl = newArrangement1.hrl;
            //     arrangement.printId = newArrangement._id;
            //     arrangement.save(function (err, orignialArr) {
            //       if (err) {
            //         utils.errLog(req, res, 'printables.placeFlowerCreate.8', err, false);
            //       }
            //     });
            // User.findById({'_id': ObjectId(input.usr)}, function (err, user) {
            //     if (err) {
            //         utils.errLog(req, res, 'printables.placeFlowerCreate.9', err, true);
            //     } else {
            //         if (user.member.enl > 0) {
            //             user.member.enl--;
            //         } else if (user.member.aen > 0) {
            //             user.member.aen--;
            //         }
            //         user.save(function (err, user) {
            //             if (err) {
            //                 utils.errLog(req, res, 'printables.placeFlowerCreate.4', err, true);
            //             }
            //         });
            //     }
            // });

            console.log(result.UpdatePhotoResult.PageUrl);
            if (calltype == 'scheduler') {
              Scheduler.update({ aId: arrangement._id }, {
                $set: {
                  printId: '',
                  sta: 3, // completed
                  pub: true,
                  las: new Date(), // Status of job  0 = ready to execute, 1 = checked out, 2 = failed ready to retry, 3 =  completed, 5 = Failed and Refunded
                  gId: arrangement.gId, // gallery Id image stored in
                  pId: arrangement.pId, // photo ID of image from zenfolio
                  hrl: arrangement.hrl,
                  zUrl: arrangement.zUrl,
                  tit: arrangement.tit

                }
              }, function (err, result1) {
                if (err) {
                  utils.errLog(req, res, 'printables.placeFlowerCreate.5', err, true);
                } else {
                  updateArrangement(req, res, arrangement, input);
                }
              });
            } else {
              updateArrangement(req, res, arrangement, input);
            }
            //   }
            // });
            // });
          }

        });
      }
    });
  });
};



/**
 * Send Email on completion
 */

 function sendEmail(data, input, msgType) {
  // var emailId = req.param('emailId');
  // var data = req.body;
  // var arrangementId = data.currentfileID;


  // save record of published image and add ID to email
  var completedMsg = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
    '<html lang="en">' +
    '<head>' +
    '<meta http-equiv="content-type" content="text/html; charset=ISO-8859-1">' +
    '</head>' +
    '<body bgcolor="#ffffff" text="#000000">' +
    i18n.__('YOUR_REQUESTED_ENLARGEMENT') + input.tit + i18n.__('IS_AVAILABLE_AT') + input.zUrl + '<br><br>' +
    i18n.__('YOUR_ENLARGEMENTS_GALLERY_CAN_BE_FOUND_AT') + input.galleryUrl + '<br><br>' +
    i18n.__('ENLARGEMENTS_ID_EQUALS') + input.aId + '<br><br>' +
    i18n.__('CLICK_FLOWERARCHITECT_COM_ARRANGER_ID') + input.aId + i18n.__('TO_LOAD_AND MODIFY_ARRANGEMENT') + '<br>' +
    '<div class="moz-signature"><i><br>' +
    '<br>' +
    i18n.__('REGARDS') + '<br>' +
    'FlowerArchitect.com<br>' +
    '</i></div>' +
    '</body>' +
    '</html>';

  var failedMsg = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional //EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">' +
    '<html lang="en">' +
    '<head>' +
    '<meta http-equiv="content-type" content="text/html; charset=ISO-8859-1">' +
    '</head>' +
    '<body bgcolor="#ffffff" text="#000000">' +
    i18n.__('YOUR_REQUESTED_ENLARGEMENT') + input.aId + i18n.__('FAILED_TO_GENERATE_WE_HAVE_CREDITED_THE_TOKEN_BACK_TO_YOUR_ACCOUNT_PLEASW_RETRY') + '<br>' +
    '<div class="moz-signature"><i><br>' +
    '<br>' +
    i18n.__('REGARDS') + '<br>' +
    'FlowerArchitect.com<br>' +
    '</i></div>' +
    '</body>' +
    '</html>';

  var message = '';
  if (msgType == 'COMPLETED') {
    message = completedMsg;
  } else {
    message = failedMsg;
  }

  // var eMailData = JSON.parse(input.eMailData);
  // function email(SourceEmailAddress, RecipientEmailAddress) {
  var params = {
    Destination: {
      ToAddresses: [input.eml.to],
    },
    Message: {
      Body: {
        // Text: { Data: "Test" },
        Html: {
          // HTML Format of the email
          Charset: "UTF-8",
          Data: message
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: input.sub
      }
    },
    Source: process.env.sourceEmailAddress
  };
  var emailResult = ses.sendEmail(params);
  deleteQueMessage(data);
  return;
  // };
  // transporter.sendMail({
  //   from: 'flowerarchitect@gmail.com',
  //   // to: 'rick.sturgeon@yahoo.com',
  //   to: input.eml.to,
  //   cc: input.eml.cc,
  //   bc: input.eml.bc,
  //   subject: input.sub,
  //   html: message
  // }, function (err, info) {
  //   if (err) {
  //     utils.errLog(req, res, 'emails.postSend.1', 'mail not sent' + err, true);
  //   } else {
  //     deleteQueMessage(data);
  //     findNextEnlargement();
  //   }
  // });
};

/*
* arrangerXYNormalize(type, value)
*
*/

function arrangerXYNormalize(type, value, direction, dpi) {



  if (direction == 'height') {
    var coordinateValue = (value * -1);

    var decodedValue = Math.round(Number(((coordinateValue * config.scalingFactor) / (75 / (photoDPI))) / 100)); //result in pixels from top 72 dpi

    decodedValue = decodedValue;
  } else {
    var coordinateValue = value;
    var decodedValue = Math.round(Number(((coordinateValue * config.scalingFactor) / (75 / (photoDPI))) / 100)); //pixels from left
    // var decodedValue = Math.round(Number(((coordinateValue *  photoDPI) ) / 1000)); //pixels from left

    decodedValue = decodedValue;
  }

  return decodedValue;
  // }
}

function placeFlowerCreate(req, res, arrangement, flowers, j, flowerCount, tempUploadFile, path, input, unlinkTemp) {
  // wait for all images to load
  canvas_img[j] = new Image();
  canvas_img[j].crossOrigin = 'Anonymous';
  canvas_img[j].onload = function () {
    var x_pos = flowers[j].xpo;
    var y_pos = flowers[j].ypo;

    var flowerX = (((x_pos - minimum_x) * resizeRatio) / scaleRatio);
    var flowerY = (((y_pos - minimum_y) * resizeRatio) / scaleRatio);
    var flowerWidth = (flowers[j].imageWidth * resizeRatio) / scaleRatio;
    var flowerHeight = (flowers[j].imageHeight * resizeRatio) / scaleRatio;


    // console.log('resize ratio = ');
    // console.log(resizeRatio);
    // console.log('scale ration =');
    // console.log(scaleRatio);
    // // write to canvas
    // console.log('x, y, w, h');
    // console.log(flowerX);
    // console.log(flowerY);
    // console.log(flowerWidth);
    // console.log(flowerHeight);

    if (flowers[j].rot) {
      ctx.save();
      // ctx.translate(flowerX, flowerY); // see http://creativejs.com/2012/01/day-10-drawing-rotated-images-into-canvas/
      ctx.translate(flowerX + flowerWidth / 2, flowerY + flowerHeight / 2);
      ctx.rotate(flowers[j].rot * Math.PI / 180);
      ctx.drawImage(canvas_img[j], -flowerWidth / 2, -flowerHeight / 2, flowerWidth, flowerHeight);
      ctx.restore();
    } else {
      ctx.drawImage(canvas_img[j], flowerX, flowerY, flowerWidth, flowerHeight);
    }
    // handle z
    // delete temp file call back if not from library.
    if (unlinkTemp) {
      fs.unlink(tempUploadFile, function (err) {
        if (err) {
          utils.errLog(req, res, 'printables.placeFlowerCreate.1', err, false);
        }
      });
    }
    incrementCounter();
  };

  var obj = {};
  console.log(tempUploadFile);
  canvas_img[j].src = tempUploadFile;
  j++;
  if (j < flowerCount) {
    placeFlower(req, res, arrangement, flowers, j, flowerCount, input);
  }

  function incrementCounter() {
    // console.log('increment Counter ' + imageLoadedCounter);
    imageLoadedCounter++;
    if (imageLoadedCounter >= imageCount) {
      console.log('all files loaded');
      // crop finised immage

      //  canvas crop
      function cropCanvas(canvas, ctx) {
        var imgWidth = ctx.canvas.width;
        var imgHeight = ctx.canvas.height;
        var imageData = ctx.getImageData(0, 0, imgWidth, imgHeight),
          data = imageData.data,
          getAlpha = function (x, y) {
            return data[(imgWidth * y + x) * 4 + 3];
          },
          scanY = function (fromTop) {
            var offset = fromTop ? 1 : -1;

            // loop through each row
            for (var y = fromTop ? 0 : imgHeight - 1; fromTop ? (y < imgHeight) : (y > -1); y += offset) {

              // loop through each column
              for (var x = 0; x < imgWidth; x++) {
                if (getAlpha(x, y)) {
                  return y;
                }
              }
            }
            return null; // all image is white
          },
          scanX = function (fromLeft) {
            var offset = fromLeft ? 1 : -1;

            // loop through each column
            for (var x = fromLeft ? 0 : imgWidth - 1; fromLeft ? (x < imgWidth) : (x > -1); x += offset) {

              // loop through each row
              for (var y = 0; y < imgHeight; y++) {
                if (getAlpha(x, y)) {
                  return x;
                }
              }
            }
            return null; // all image is white
          };

        var cropTop = scanY(true),
          cropBottom = scanY(false),
          cropLeft = scanX(true),
          cropRight = scanX(false);

        var relevantData = ctx.getImageData(cropLeft, cropTop, cropRight - cropLeft, cropBottom - cropTop);
        canvas.width = cropRight - cropLeft + imageBorder;
        canvas.height = cropBottom - cropTop + imageBorder * 1.3;



        ctx.putImageData(relevantData, imageBorder / 2, imageBorder / 2);



      };

      // crop canvas
      cropCanvas(canvas, ctx);

      canvas.toBuffer(function (err, buf) {
        if (err) {
          utils.errLog(req, res, 'printables.placeFlowerCreate.2', err, true);
        } else {

          var arrangement72 = config.myRootDir + 'public/tmpImg/' + path + '3' + '.png';
          fs.writeFile(arrangement72, buf, 'base64', function (err) {
            if (err) {
              utils.errLog(req, res, 'printables.placeFlowerCreate.3', err, true);
            }
            else {
              canvas = ' '; // try to free canvas memory to be garbage collected
              // create temp resize file
              var tempPrintFile = config.myRootDir + 'public/tmpImg/FlowerArchitect_' + arrangement.tit.replace(' ', '_') + '.png';
              console.log('enlarging arrangement ' + tempPrintFile);

              // calculate image size to increase based on canvas size.
              // var imageResizeDPI = input.dpi * maxImageResizeWidth / canvas_width;
              var imageResizeDPI = input.dpi;
              // -crop 40x30+10+10
              fs.stat(arrangement72, function (err, stat) {
                if (err) {
                  utils.errLog(req, res, 'printables.placeFlowerCreate.4', err, true);
                } else {
                  if (stat) {
                    var fileSizeInBytes = stat.size;
                    //Convert the file size to megabytes (optional)
                    var fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
                    // console.log('temp filesize = ' + fileSizeInMegabytes);
                    if (fileSizeInMegabytes > maxMegabytesTemp72) {
                      imageResizeDPI = imageResizeDPI * maxMegabytesTemp72 / fileSizeInMegabytes;
                      console.log('New Resize DPI = ' + imageResizeDPI);
                    }
                  }

                  var imoptions = {
                    srcPath: arrangement72,
                    dstPath: tempPrintFile,
                    width: '',
                    height: '',
                    resize: '',
                    progressive: '',
                    customArgs: ['-resample', imageResizeDPI / 2.54],
                    quality: 0.9,
                    format: 'png',
                    colorspace: 'LAB',
                    filter: 'Mitchell',  //to reduce Lagrange
                    sharpening: 0.2,
                    strip: true,
                    timeout: 0
                  };

                  // resize to correct size  use compression quality setting of 10
                  im.resize(imoptions, function (err) {
                    if (err) {
                      utils.errLog(req, res, 'printables.placeFlowerCreate.5', err, true);
                    } else {

                      fs.unlink(arrangement72, function (err) {
                        if (err) {
                          utils.errLog(req, res, 'printables.placeFlowerCreate.6', err, false);
                        }
                      });
                      // Add arrangement info to 300 dpi image
                      // const buffer = fs.readFileSync(tempPrintFile);
                      // const chunks = extract(buffer);
                      var buffer = fs.readFileSync(tempPrintFile);
                      var chunks = extract(buffer);

                      // create metaData string    id,rev,pub date,lrl,hrl
                      var metaData = {
                        aId: arrangement._id,
                        rev: arrangement.rev,
                        pub: arrangement.pub,
                        lvl: arrangement.lrl
                      };

                      // Add new chunks before the IEND chunk
                      chunks.splice(-1, 0), text.encode('copyright', '© ' + moment().format('YYYY') + ' Sealogix, Corp.');
                      /// add metadata of arrangement
                      chunks.splice(-1, 0, text.encode('flwd', JSON.stringify(metaData)));
                      // create arrangement data string
                      chunks.splice(-1, 0, text.encode('flwf', JSON.stringify(arrangement.flw)));


                      var currentDate = moment();
                      var month = currentDate.format('M');
                      var year = currentDate.format('YYYY');
                      if (calltype == 'scheduler') {
                        var userId = input.usr;
                      } else {
                        var userId = req.user._id;
                      }
                      User.findOne({ '_id': ObjectId(userId) }, {
                        gallerys: { $elemMatch: { year: year, month: month } }
                      }, function (err, monthData) {
                        if (err) {
                          utils.errLog(req, res, 'printables.placeFlowerCreate.7', err, true);
                        } else {
                          if (monthData && monthData.gallerys && monthData.gallerys.length) {
                            var galleryId = monthData.gallerys[0].gId;
                            uploadImageToZenfolio(res, req, arrangement, galleryId, tempPrintFile);
                          } else {
                            User.findOne({ _id: ObjectId(input.usr) }, function (err, user) {  // TODO: change to zpr: true
                              if (err) {
                                utils.errLog(req, res, 'printables.placeFlowerCreate.8', err, true);
                                return false;
                              } else {
                                if (user) {

                                  // create monthly gallery
                                  zf.executeCommands(req, res, config.zfsetup, function (client) {
                                    var args = {
                                      'groupId': user.gId,
                                      'type': 'Gallery',
                                      updater: {
                                        'Title': year + '-' + month // set title 2017-11
                                      }
                                    };
                                    // console.log(args);
                                    client.CreatePhotoSet(args, function (err, result) {
                                      if (err) {
                                        utils.errLog(req, res, 'printables.placeFlowerCreate.9', err, true);
                                        return;
                                      }
                                      result = JSON.parse(JSON.stringify(result));
                                      // save zenfolio group id
                                      if (!result.CreatePhotoSetResult) {
                                        utils.errLog(req, res, 'printables.placeFlowerCreate.10', 'Failed to create group in Zenfolio', true);
                                      } else {
                                        var newGallery = {
                                          year: year, // year
                                          month: month, // month
                                          zId: result.CreatePhotoSetResult.Id, // Zenfolio ID
                                          gId: zf.getID(zf.Type.GALLERY, result.CreatePhotoSetResult.PageUrl), // Gallery ID
                                          zUrl: result.CreatePhotoSetResult.PageUrl, // gallery url
                                          uUrl: result.CreatePhotoSetResult.UploadUrl// upload url for zenfolio photoset
                                        };

                                        User.findOneAndUpdate(
                                          { _id: ObjectId(userId) },
                                          { $push: { 'gallerys': newGallery } },
                                          { safe: true, upsert: true },
                                          function (err, model) {
                                            if (err) {
                                              utils.errLog(req, res, 'printables.placeFlowerCreate.11', err, true);
                                            } else {
                                              var galleryId =
                                                uploadImageToZenfolio(res, req, arrangement, galleryId, tempPrintFile);
                                            }
                                          });
                                      }
                                    });

                                  });
                                } else {
                                  utils.errLog(req, res, 'printables.placeFlowerCreate.12', 'User Not Found So Parent Folder Not Found', true);
                                }
                              }
                            });
                          }
                        }
                      });


                    }
                  });
                }
              });

            }
          });
        }
      });
    }
  }
}

function placeFlower(req, res, arrangement, flowers, j, flowerCount, input) {

  var prePlaceFlowerCreate = function (req, res, arrangement, flowers, j, flowerCount, tempUploadFile, path, input) {
    if (flowers[j].cam == 'F') {
      // var flowerWidth = (flowers[j].imageWidth * resizeRatio) / scaleRatio;
      // var flowerHeight = (flowers[j].imageHeight * resizeRatio) / scaleRatio;

      var tempFarCamera = config.myRootDir + 'public/tmpImg/' + path + '2' + '.png';
      // calculate image size to increase based on canvas size.
      var imageResizeDPI = 72 * 2.5;
      console.log(imageResizeDPI);
      // -crop 40x30+10+10

      var imoptions = {
        srcPath: tempUploadFile,
        dstPath: tempFarCamera,
        width: '',
        height: '',
        resize: '',
        progressive: '',
        customArgs: ['-resample', imageResizeDPI / 2.54],
        quality: 0.9,
        format: 'png',
        colorspace: 'LAB',
        filter: 'Mitchell',  //to reduce Lagrange
        sharpening: 0.2,
        strip: true,
        timeout: 0
      };

      // resize to correct size  use compression quality setting of 10
      im.resize(imoptions, function (err) {
        if (err) {
          utils.errLog(req, res, 'printables.prePlaceFlowerCreate.1', err, true);
        } else {
          var unlinkTemp = true;
          placeFlowerCreate(req, res, arrangement, flowers, j, flowerCount, tempFarCamera, path, input, unlinkTemp);
        }
      });
    } else {
      var unlinkTemp = false;
      placeFlowerCreate(req, res, arrangement, flowers, j, flowerCount, tempUploadFile, path, input, unlinkTemp);

    }
  };

  tmp.tmpName({ template: 'tmp-XXXXXXXX' }, function _tempNameGenerated(err, path) {
    if (err) {
      utils.errLog(req, res, 'printables.placeFlower.1', err, true);
    } else {
      var tempUploadFile = config.myRootDir + 'public/tmpImg/' + path + '1' + '.png';
      // console.log(tempUploadFile);
      var cFlw = flowers[j];
      if (!cFlw) {
        console.log('no flower found for count = ' + j + ' of total' + flowerCount + ' for flower ' + arrangement.tit + 'flowerId = ' + s3Flw72Image);
        return;
      }
      if (config.useAmazon) { // consider storing on amazon server to speed up
        var s3Flw72Image = cFlw.cat + '/' + cFlw.col + '/' + cFlw.nam + '/72/' + cFlw.nam + '-72_' + cFlw.imp + '.png';
        var params = { Bucket: 'flw72', Key: s3Flw72Image };
        var filePtr = fs.createWriteStream(tempUploadFile);
        // consider createObjectURL, need to check if works in nodejs
        AWS_s3.getObject(params).createReadStream().on('error', function (err) {
          utils.errLog(req, res, 'printables.placeFlower.2', err, true);
          errorValue = 'printables.placeFlower.2 ' + err;
        }).pipe(filePtr).on('finish', function (err) {
          if (err) {
          } else {
            placeFlowerCreate(req, res, arrangement, flowers, j, flowerCount, tempUploadFile, path, input, true);
          }
        });

      } else {
        // console.log(cFlw);
        var localFlower72Path = config.myRootDir + 'public/arranger/flw72/' + cFlw.prf + '72/' + cFlw.nam + '-72_' + cFlw.imp + '.png';
        prePlaceFlowerCreate(req, res, arrangement, flowers, j, flowerCount, localFlower72Path, path, input, false);

        // fsx.copy(localFlower72Path, tempUploadFile, {replace: true}, function (err) {
        //   if (err) {
        //     // i.e. file already exists or can't write to directory
        //     utils.errLog(req, res, 'printables.placeFlower.3', err, true);
        //   }
        //   placeFlowerCreate(req, res, arrangement, flowers, j, flowerCount, tempUploadFile, path, input);
        // });
      }
    }
  });
}

function createEnlargement(input) {
  // set reduced canvas size
  var min_x = 1000000;
  var min_y = 1000000;
  var max_x = -1000000;
  var max_y = -1000000;

  var maxCanvasX = -1000000;
  var minCanvasX = 1000000;

  var maxCanvasY = -1000000;
  var minCanvasY = 1000000;

  // data.arrangement = JSON.parse(req.body.data);

  var arrangementFlowers = [];
  var flowers = '';
  var currentArrangement = '';

  // var arrangementFields = {
  //   flw: 1,
  //   tit: 1,
  //   des: 1,
  //   var: 1,
  //   rev: 1,
  //   puz: 1,
  //   tit: 1,
  //   dlv: 1,
  //   ord: 1,
  //   dpi: 1,
  //   pub: 1,
  //   lvl: 1
  // };
  // Arrangement.findOne({ _id: ObjectId(input.aId) }, arrangementFields, function (err, arrangement) {
  //   if (err) {
  //     utils.errLog(req, res, 'printables.createEnlargement.2', err, true);
  //   }

    if (input && input.arr && input.arr.flw) {
      var arrangement = input.arr;
      console.log('resizing arrangement ' + arrangement.aid);
      idList = [];
      flowers = arrangement.flw;
      arrangement.flw.forEach(function (myDoc) {
        var i = 0;
        var newId = true;
        while (i < idList.length) {
          if (idList[i] === myDoc.flowerId) {
            newId = false;
            break;
          }
          else {
            i += 1;
          }
        }
        if (newId === true) {
          idList.push(myDoc.flowerId);
          // console.log(myDoc.flowerId);
        }
      });
      var fields = {
        nam: 1,
        col: 1,
        cat: 1,
        cam: 1,
        prf: 1,
        mas: 1,
        tun: 1,
        imW: 1,
        imH: 1
      };

      // return the zenfolio urls to the thumbnail and image based on user settings of size for each eg z35
      function checkMaxX(x, imageWidth, imageHeight) {
        if (maxCanvasX < x + imageWidth) {
          maxCanvasX = x + imageWidth + 1;
        }
      }

      function checkMinX(x) {
        if (minCanvasX > x) {
          minCanvasX = x;
        }
      }

      function checkMaxY(y, imageWidth, imageHeight) {
        if (maxCanvasY < y + imageHeight) {
          maxCanvasY = y + imageHeight + 1;
        }
      }

      function checkMinY(y) {
        if (minCanvasY > y) {
          minCanvasY = y;
        }
      }

      function checkAngle(x, y, angleDeg, xC, yC, imageWidth, imageHeight) {
        var angleRad = angleDeg * Math.PI / 180;
        var newX = x * Math.cos(angleRad) - y * Math.sin(angleRad);
        var newY = x * Math.sin(angleRad) + y * Math.cos(angleRad);
        newX += xC;
        newY += yC;

        checkMaxX(newX, imageWidth, imageHeight);
        checkMinX(newX);
        checkMaxY(newY, imageWidth, imageHeight);
        checkMinY(newY);
      }
      Flower.find({ '_id': { $in: idList } }, fields, function (err, flowerCursor) {
        if (err) {
          utils.errLog(req, res, 'printables.createEnlargement.3', err, true);
        } else {
          if (!flowerCursor) {
            console.log('no flowers found');
          } else {

            data = [];
            var i = 0;
            flowerCursor.forEach(function (flower2) {
              if (flower2) {
                data[i] = flower2;
                i++;
              }
            });


            // First sort by z index
            var flowersSorted = flowers.sort(function (obj1, obj2) {
              // Ascending: first age less than the previous
              return obj1.zin - obj2.zin;
            });
            for (i = 0; i < flowersSorted.length; i++) {
              for (j = 0; j < data.length; j++) {
                if (flowersSorted[i].flowerId.equals(data[j]._id)) {
                  // flip the axis to match computer from y positive up to y positive down
                  var xpo = arrangerXYNormalize('decode', Number(flowersSorted[i].xpo), 'width', arrangement.dpi);
                  var ypo = arrangerXYNormalize('decode', Number(flowersSorted[i].ypo), 'height', arrangement.dpi);

                  // console.log('x y raw');
                  // console.log(xpo);
                  // console.log(ypo);
                  var rot = flowersSorted[i].rot;
                  var n = parseInt(flowersSorted[i].imp);
                  var mas = 1;  // set flower width and height and apply master and tuning ratios is set
                  var tun = 1;
                  if (data[j].mas) {
                    mas = data[j].mas;
                  }
                  if (data[j].tun) {
                    tun = data[j].tun[flowersSorted[i].imp];
                  }
                  var imageWidth = Number(data[j].imW.split(',')[n] * mas * tun);
                  var imageHeight = Number(data[j].imH.split(',')[n] * mas * tun);

                  if (data[j].cam == 'F') {
                    // resize 2.5 times increase and adjust imageWidth and imageHeight
                    imageWidth = imageWidth * 2.5;
                    imageHeight = imageHeight * 2.5;
                  }

                  if (rot) {
                    var xIndice = imageWidth / 2;
                    var yIndice = imageHeight / 2;
                    var xCenter = xpo + xIndice;
                    var yCenter = ypo + yIndice;
                    checkAngle(-xIndice, yIndice, rot, xCenter, yCenter, imageWidth, imageHeight);
                    checkAngle(-xIndice, -yIndice, rot, xCenter, yCenter, imageWidth, imageHeight);
                    checkAngle(xIndice, yIndice, rot, xCenter, yCenter, imageWidth, imageHeight);
                    checkAngle(xIndice, -yIndice, rot, xCenter, yCenter, imageWidth, imageHeight);
                  } else {
                    checkMaxX(xpo, imageWidth, imageHeight);
                    checkMinX(xpo);
                    checkMaxY(ypo, imageWidth, imageHeight);
                    checkMinY(ypo);
                  }

                  // if (min_x > xpos) {
                  //     min_x = xpos;
                  //
                  // }
                  // if (min_y > ypos) {
                  //     min_y = ypos;
                  //
                  // }
                  // if (max_x < xpos) {
                  //     max_x = xpos;
                  //
                  // }
                  // if (max_y < ypos) {
                  //     max_y = ypos;
                  // }

                  var nextFlower = {
                    flowerId: flowersSorted[i].flowerId,
                    _id: flowersSorted[i]._id,
                    imp: flowersSorted[i].imp,
                    zin: flowersSorted[i].zin,
                    rot: flowersSorted[i].rot,
                    dlv: flowersSorted[i].dlv,
                    ord: flowersSorted[i].ord,
                    xpo: xpo,
                    ypo: ypo,
                    nam: data[j].nam,
                    col: data[j].col,
                    cat: data[j].cat,
                    prf: data[j].prf,
                    cam: data[j].cam,
                    imageWidth: imageWidth,
                    imageHeight: imageHeight
                  };
                  arrangementFlowers.push(nextFlower);
                  break;
                }
              }
              if (j == data.length) {
                console.log('flower in arrangement not found');
                console.log(flowersSorted[i]);
              }
            }
            var negXCorrFact = 0;
            var negYCorrFact = 0;
            if (minCanvasX < 0) {
              negXCorrFact = (minCanvasX * -1);
              min_x = 1;
            } else {
              var min_x = minCanvasX + 1;
            }
            if (minCanvasY < 0) {
              negYCorrFact = (minCanvasY * -1);
              var min_y = 1;
            } else {
              var min_y = minCanvasY;
            }
            var max_x = maxCanvasX + negXCorrFact;
            var max_y = maxCanvasY + negYCorrFact;
            // var last_i = i - 1;

            // normalize flowers x y
            for (i = 0; i < arrangementFlowers.length; i++) {
              arrangementFlowers[i].xpo = arrangementFlowers[i].xpo + negXCorrFact + 1;
              arrangementFlowers[i].ypo = arrangementFlowers[i].ypo + negYCorrFact + 1;

              // recheck to find canvas side considering image sizes
              var max_xpos = Number(arrangementFlowers[i].xpo) + Number(arrangementFlowers[i].imageWidth);
              var max_ypos = Number(arrangementFlowers[i].ypo) + Number(arrangementFlowers[i].imageHeight);
              if (max_x < max_xpos) {
                max_x = max_xpos;
              }
              if (max_y < max_ypos) {
                max_y = max_ypos;
              }
            }
            canvas_width = (((Number(max_x) - Number(min_x)) / scaleRatio) + (imageBorder / scaleRatio));
            canvas_height = (((Number(max_y) - Number(min_y)) / scaleRatio) + (imageBorder / scaleRatio));

            // limit canvas size for very large images
            if (canvas_width > maxCanvasWidth) {
              resizeRatio = maxCanvasWidth / canvas_width;
              canvas_width = maxCanvasWidth;
            }
            if (canvas_height > maxCanvasHeight) {
              if (resizeRatio > maxCanvasHeight / canvas_height) {
                resizeRatio = maxCanvasHeight / canvas_height;
              }
              canvas_height = maxCanvasHeight;
            }

            // console.log('width / height');
            // console.log(canvas_width);
            // console.log(canvas_height);
            canvas = new Canvas(canvas_width, canvas_height);
            ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            minimum_x = min_x;
            minimum_y = min_y;
            imageCount = arrangement.flw.length;
            imageLoadedCounter = 0;
            placeFlower(req, res, arrangement, arrangementFlowers, 0, arrangementFlowers.length, input);
          }
        }
      });
    }
  // });
};

exports.processPrintables = function () {
  checkMessages();
  // check if documents exist first
  // Scheduler.find({}, { _id: 1 }, function (err, results) {
  //   if (err) {
  //     utils.errLog(req, res, 'printables.processPrintables.1', err, true);
  //   } else {
  //     if (results.length) {
  //       // req.locals.setLocale(req.user.profile.language);  // req does not exist
  //       // look for jobs that are checked out but more than 15 min old and marked failed
  //       var failedDate = moment().subtract(CheckedOutTooLongMinutes, 'minutes');
  //       // Scheduler.update({processorId: config.myProcessorId, sta: 1, las: {$lt: failedDate}}, {
  //       Scheduler.update({ sta: 1, las: { $lt: failedDate } }, {
  //         $set: {
  //           sta: 2,
  //           $inc: { rty: 1 },
  //           las: moment()
  //         }
  //       }, { multi: true }, function (err, failedItems) {
  //         if (err) {
  //           utils.errLog(req, res, 'printables.processPrintables.2', err, true);
  //         } else {
  //           if (failedItems.n) {
  //             console.log('Items Failed and set to 2');
  //             console.log(failedItems);
  //           }
  //           // next retry failed jobs more then 30 min since last retry
  //           var retryDate = moment().subtract(RetryMinutes, 'minutes');
  //           Scheduler.update({ sta: 2, las: { $lt: retryDate } },
  //             {
  //               $set: { sta: 0, las: moment() }
  //             }, { multi: true }, function (err, retryItems) { // .todo add time check increment rty
  //               if (err) {
  //                 utils.errLog(req, res, 'printables.processPrintables.3', err, true);
  //               } else {
  //                 if (retryItems.n) {
  //                   console.log('Items To retry and set back to 0');
  //                   console.log(retryItems);
  //                 }
  //                 // check to see if in process item
  //                 Scheduler.find({ sta: 1 }, { _id: 1 }, function (err, inProcess) {
  //                   if (err) {
  //                     utils.errLog(req, res, 'printables.processPrintables.1', err, true);
  //                   } else {
  //                     if (inProcess.length) {
  //                       console.log('enlargemet in progress, cycle skipped');
  //                     } else {
  //                       findNextEnlargement(req, res);
  //                       // removed completed arrangements and move to
  //                       Scheduler.find({ sta: 3 }, function (err, completedSchedules) {
  //                         if (err) {
  //                           utils.errLog(req, res, 'printables.processPrintables.4', err, true);
  //                         } else {
  //                           if (completedSchedules) {

  //                             completedSchedules.forEach(function (completedSchedule) {
  //                               if (completedSchedule) {
  //                                 console.log('Moved to Enlargements History ' + completedSchedule._id + ' User = ' + completedSchedule.usr);

  //                                 // delete completedSchedule.__v;
  //                                 var recordData = {
  //                                   _id: completedSchedule._id,
  //                                   usr: completedSchedule.usr,
  //                                   printId: completedSchedule.printId,
  //                                   las: completedSchedule.las,
  //                                   lan: completedSchedule.lan,
  //                                   hrl: completedSchedule.hrl,
  //                                   zUrl: completedSchedule.zUrl,
  //                                   pId: completedSchedule.pId,
  //                                   gId: completedSchedule.gId,
  //                                   cre: completedSchedule.cre,
  //                                   err: completedSchedule.err,
  //                                   nam: completedSchedule.nam,
  //                                   tit: completedSchedule.tit,
  //                                   sta: completedSchedule.sta,
  //                                   rty: completedSchedule.rty,
  //                                   pub: completedSchedule.pub,
  //                                   eml: completedSchedule.eml,
  //                                   siz: completedSchedule.siz,
  //                                   dpi: completedSchedule.dpi,
  //                                   aId: completedSchedule.aId,
  //                                   job: completedSchedule.job
  //                                 };

  //                                 var enlargement = new Enlargements(recordData);
  //                                 enlargement.save(function (err, savedEnlargement) {
  //                                   if (err) {
  //                                     utils.errLog(req, res, 'printables.processPrintables.5', err, true);
  //                                   } else {
  //                                     Scheduler.remove({
  //                                       _id: completedSchedule._id
  //                                     }, function (err, arrangement1) {
  //                                       // .todo no return just finish, could redo this as a funciton and make fully async
  //                                     });
  //                                   }
  //                                 });
  //                               }
  //                             });
  //                           }
  //                         }

  //                       });
  //                     }
  //                   }
  //                 });
  //               }
  //             });
  //         }
  //       });
  //     } else {
  //       console.log('No enlargements scheduled');
  //     }
  //   }
  // }).limit(1);
};
