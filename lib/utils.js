/*
 *  util.js in /lib
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

/**
 * Formats mongoose errors into proper array
 *
 * @param {Array} errors
 * @return {Array}
 * @api public
 */

// var mongoose = require('mongoose')
    // , Arrangement = require('../models/arrangement')
    // , ShareImage = require('../models/shareImage')
    // , Counter = require('../models/counter')
    // , GroupArrangement = require('../models/groupArrangement')
    // , Scheduler = require('../models/scheduler')
    // , Flower = require('../models/flower')
    // , User = require('../models/User')
    // , List = require('../models/list')
    // , Group = require('../models/group')
    // , session = require('express-session')
    // , utils = require('../lib/utils')
    // , extend = require('util')._extend
    // , ObjectId = require('mongoose').Types.ObjectId
    // , express = require('express')
    // , app = express()
    // , fs = require('fs-extended')
    // , config = require('../config/config')
    // , fsx = require('fs.extra')
    // , zf = require('../controllers/JSZenFolio')
    // , getSize = require('get-folder-size')
    // , auth = require('../config/middlewares/authorization')
    // , moment = require('moment')
    // , extract = require('png-chunks-extract')
    // , encode = require('png-chunks-encode')
    // , text = require('png-chunk-text')
    // , path = require('path')
    // , google = require('googleapis')
    // , urlshortener = google.urlshortener('v1')
    // , secrets = require('../config/secrets')
    // , request = require('request');


exports.errors = function (errors) {
    var keys = Object.keys(errors)
    var errs = []

    // if there is no validation error, just display a generic error
    if (!keys) {
        return ['Oops! There was an error']
    }

    keys.forEach(function (key) {
        errs.push(errors[key].message)
    })

    return errs
}

/**
 * Index of object within an array
 *
 * @param {Array} arr
 * @param {Object} obj
 * @return {Number}
 * @api public
 */

exports.indexof = function (arr, obj) {
    var index = -1; // not found initially
    var keys = Object.keys(obj);
    // filter the collection with the given criterias
    var result = arr.filter(function (doc, idx) {
        // keep a counter of matched key/value pairs
        var matched = 0;

        // loop over criteria
        for (var i = keys.length - 1; i >= 0; i--) {
            if (doc[keys[i]] === obj[keys[i]]) {
                matched++;

                // check if all the criterias are matched
                if (matched === keys.length) {
                    index = idx;
                    return idx;
                }
            }
        }
        ;
    });
    return index;
}

/**
 * Find object in an array of objects that matches a condition
 *
 * @param {Array} arr
 * @param {Object} obj
 * @param {Function} cb - optional
 * @return {Object}
 * @api public
 */

exports.findByParam = function (arr, obj, cb) {
    var index = exports.indexof(arr, obj)
    if (~index && typeof cb === 'function') {
        return cb(undefined, arr[index])
    } else if (~index && !cb) {
        return arr[index]
    } else if (!~index && typeof cb === 'function') {
        return cb('not found')
    }
    // else undefined is returned
}

/**
 * errLog Custom Error for FloweArchitect
 *
 * @param {Array} errors
 * @return {Array}
 * @api public
 */

exports.errLog = function (req, res, location, err, send) {
    if(config.currentRequestId) {
        Scheduler.findByIdAndUpdate({_id: config.currentRequestId}, {err: err, sta: 2}, function (error, doc) {
            config.currentRequestId = '';
            process.env.ENLARGEMENT_PROCESS = 'available';
          if (error) {
                console.log('Error: at Utils.enErrLog.1', error);
            } else {
                console.log('Error: at ' + location, err);
                return true;
            }
        });
    } else {
        if (req && req.user) {
            var userId = req.user._id
        } else {
            var userId = '';
        }
        var userId = 'guest'
        console.log('Error: at ' + location + ', user: ' + userId, err);
        // if (send === true) {
        //     return ({success: false, msg: 'Error: at ' + location, err: err});
        // }
    }
}


/**
 * nextRevision Custom Error for FloweArchitect
 *
 * @param string revision
 * @return string
 * @api public
 */

exports.nextRevision = function (revision) {
    var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    var length = revision.length;
    var valueOfLastCharacter = revision[length - 1];
    var indexOfLastCharacter = alphabet.indexOf(valueOfLastCharacter);

    if (valueOfLastCharacter == 'Z') // convert revision Z to revision AA  or revision AZ to AAA the next reverion
        switch (length) {
            case 1:
                return 'AA'; // move to 2 characters
                break;
            case 2: // move from AZ to BA up to ZZ
                var firstCharacter = revision[0];
                if (firstCharacter == 'Z') { // last 2 character so move to 3 character AAA
                    return 'AA';
                }
                else {
                    var indexOfFirstCharacter = alphabet.indexOf(firstCharacter);
                    return alphabet[indexOfFirstCharacter + 1] + 'A';  // go from AZ to BA
                }
                break;
            case 3: // then 3 characters starting with AAA
                var firstCharacter = revision[0];
                var secondCharacter = revision[1];
                if (secondCharacter == 'Z') {
                    if (firstCharacter == 'Z') {
                        return 'A';  // start over
                    } else {
                        var indexOfFirstCharacter = alphabet.indexOf(firstCharacter);
                        revision = alphabet[indexOfFirstCharacter + 1] + 'AA';
                        return revision;  // go from AZZ to BAA
                    }
                } else {
                    var indexOfSecondCharacter = alphabet.indexOf(secondCharacter);
                    revision[1] = alphabet[indexOfSecondCharacter + 1];
                    return (revision);  // go from A to B or AA to AB
                }
                break;
        }
    else {
        revision[length - 1] = alphabet[indexOfLastCharacter + 1];
        return (revision);  // go from A to B or AA to AB
    }
}


/**
 * combineArrangementFlowers take arrangement flower parameters and combine wity flowers and return
 *
 * @param string revision
 * @return string
 * @api public
 */

var combineFlowers = function (req, res, arrangementId, arrangementFlowers) {
    if (arrangementFlowers.flw) {
        var idList = [];
        arrangementFlowers.flw.forEach(function (myDoc) {
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
            }
        });

        var fields = {
            nam: 1,
            tit: 1,
            del: 1,
            sam: 1,
            grp: 1,
            sId: 1,
            bot: 1,
            des: 1,
            col: 1,
            cat: 1,
            pos: 1,
            prf: 1,
            mas: 1,
            tun: 1,
            imH: 1,
            imW: 1
        };
        // return the zenfolio urls to the thumbnail and image based on user settings of size for each eg z35
        if (config.useZenfolio) {
            fields[req.user.last.tsz] = 1;
            fields[req.user.last.isz] = 1;
            fields["tmb"] = 1;
            fields["img"] = 1;
        }
        Flower.find({"_id": {$in: idList}}, fields, function (err, flowerCursor) {
            if (err) {
                utils.errLog(req, res, 'arrangements.getArrangementFlowers.2', err, true);
            } else {
                res.send({
                    success: true,
                    hiResUrl: arrangementFlowers.hrl,
                    lowResUrl: arrangementFlowers.lrl,
                    arrangement: arrangementFlowers.flw,
                    arrangementId: arrangementId,
                    flowers: flowerCursor
                });
            }
        });

    } else {
        res.send({
            success: false,
            msg: "Arrangement Flowers not found"
        });
    }
}


/**
 * combineArrangementFlowers take arrangement flower parameters and combine wity flowers and return
 *
 * @param string revision
 * @return string
 * @api public
 */
exports.combineArrangementFlowers = function (req, res, arrangementId, arrangementFlowers) {
    combineFlowers(req, res, arrangementId, arrangementFlowers);
}


/**
 * getFlowerArrangement find flowers and positions in flowerArrangement by ID
 *
 * @param string revision
 * @return string
 * @api public
 */
exports.getFlowerArrangement = function (req, res, arrangementId) {


    Arrangement.findOne({"_id": ObjectId(arrangementId)}, {
        flw: 1,
        hrl: 1,
        lrl: 1,
    }, function (err, arrangementFlowers) {
        if (err) {
            utils.errLog(req, res, 'arrangements.getArrangementFlowers.1', err, true);
        } else {
            // check to see if arrangementID found in arrangements database, if not look in shareImage database
            if (arrangementFlowers) {
                combineFlowers(req, res, arrangementId, arrangementFlowers);
            } else {
                ShareImage.findOne({"_id": ObjectId(arrangementId)}, {
                    flw: 1,
                    hrl: 1,
                    lrl: 1,
                }, function (err, arrangementFlowers) {
                    if (err) {
                        utils.errLog(req, res, 'arrangements.getArrangementFlowers.1', err, true);
                    } else {
                        if (arrangementFlowers) {
                            combineFlowers(req, res, arrangementId, arrangementFlowers);
                        } else {
                            res.send({
                                success: false,
                                msg: "Arrangement ID " + arrangementId + " not found."
                            });
                        }
                    }
                });
            }
        }
    });
}
