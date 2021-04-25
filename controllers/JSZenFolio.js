/*
 *  jZenfolio.js in FlowerArchitect/arranger/app/arranger/controllers
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

(function () {

    var JSZenFolio = (function () {

        var soap = require('soap')
            , cookie = require('soap-cookie')
            , fs = require('fs')
            , http = require('follow-redirects').http
            , https = require('follow-redirects').https
            , utils = require('../lib/utils');

        https.globalAgent.options.secureProtocol = 'TLSv1_2_method';


        var configData = {
            version: '1.0'
            , APIName: 'JS ZenFolio API'
            , appName: ''
            , zenFolioAPIVer: 1.8
            , zenFolioAPIURL: 'api.zenfolio.com'
            , protocol: 'https'
            , loginName: ''
            , password: ''
            , zenToken: ''
            , zenTokenLUD: null
            , zenKeyring: ''
            , soapClient: null
        };

        var requestInfo = {
            data: {
                method: '' //this is zen folio API method like LoadGroup
                , params: {} //all the parameters for the method
                , id: 123  // make this dynamic
            }
        }

        var ZenFolioType = {
            'PHOTOSET': '/p',
            'FOLDER': '/f',
            'GALLERY': '/p',
            'COLLECTION': '/p',
            'GROUP': '/f'
        };

        var mimeTypes = {
            'jpeg': 'image/jpeg'
            , 'jpg': 'image/jpg'
            , 'jpe': 'image/jpg'
            , 'png': 'image/png'
        }

        function getPassword () {
            let params = {
                CiphertextBlob: Buffer.from(db_pass, 'base64')
            }
           
            let secret = null
            try {
                const decrypted = kms.decrypt(params).promise()
                secret = decrypted.Plaintext.toString('utf-8')
                console.log(secret);
                return (secret);
            }
            catch (exception) {
                console.error(exception)
            }
        }
        
        
        async function decryptEncodedstring(encoded) {
         
            const paramsDecrypt = kms.DecryptRequest = {
                CiphertextBlob: Buffer.from(encoded, 'base64')
            };
         
            const decryptResult = await kms.decrypt(paramsDecrypt).promise();
            if (Buffer.isBuffer(decryptResult.Plaintext)) {
                var result =  Buffer.from(decryptResult.Plaintext).toString();
                console.log(result);
                return result
            } else {
                throw new Error('We have a problem');
            }
        }

        createSoapClient = function (req, res, callback) {
            if (configData.soapClient) {
                if (callback) callback(null, soapClient);
                return;
            }
            var wsdlURL = getZenFolioFullAPIURL() + '?wsdl';
            soap.createClient(wsdlURL, function (err, client) {
                if (err) {
                    utils.errLog(req, res, 'JSZenfolio.createSoapClient.1', "building a soap client" + err, false);
                }
                var cook = {"set-cookie": ['zf_token=' + configData.zenToken]};
                client.setSecurity(new cookie(cook));
                log('Soap Client is created');
                if (callback) callback(err, client);
            });

        }
        /**
         *
         */
        getSoapClient = function (req, res, callback, newOne) {
            if (newOne) configData.soapClient = null;
            createSoapClient(req, res, callback);
        }


        log = function () {
            var now = (new Date()); //.format("dd/M/yy h:mm tt"); //Edit: changed TT to tt
        }

        getUserAgent = function () {
            return configData.appName + ' via ' + configData.APIName + ' ' + configData.version;
        }

        getZenFolioFullAPIURL = function () {
            return configData.protocol + "://" + configData.zenFolioAPIURL + "/api/" + configData.zenFolioAPIVer + "/zfapi.asmx";
        }

        /**
         * This method adds the user agents and other options from url to the header
         */
        initializeRequestHeaders = function (req, res, uploadURL) {
            var options = require('url').parse(uploadURL);
            requestInfo.reqOptions = options;
            requestInfo.reqOptions.method = 'POST';
            requestInfo.reqOptions.headers = {};
            requestInfo.reqOptions.headers['User-Agent'] = getUserAgent();
            requestInfo.reqOptions.headers['X-Zenfolio-User-Agent'] = getUserAgent();
        }

        authenticate = function (req, res, callback) {

            if (configData.zenToken && configData.zenToken !== '') {
                //if zen token is less than 12 hours, return do not renew it.
                // else let it continue and get a new token
                if (new Date() - configData.zenTokenLUD < 43200000) {
                    callback(configData.soapClient);
                    return;
                }
            }
            if (configData.loginName === '') {
                console.log('Login Name is empty');
            }
            if (configData.password === '') {
                console.log('Password is empty');
            }

            authcallback = function (req, res, response) {
                response.setEncoding('utf8');

                var str = ''
                response.on('data', function (chunk) {
                    str += chunk;
                });

                response.on('end', function () {

                    var res1 = JSON.parse(str);
                    if (res1.error) {
                        utils.errLog(req, res, 'JSZenfolio.authenticate.1', res1.error, false);
                    } else {
                        setZenToken(req, res, res1.result, callback);
                    }

                });
            };


            var authString = '["' + configData.loginName + '", "' + configData.password + '"]'
            post(req, res, 'AuthenticatePlain', authString, authcallback);
        }

        setZenToken = function (req, res, token, callback) {
            if (token && token !== '') {
                configData.zenToken = token;
                configData.zenTokenLUD = new Date();
                requestInfo.reqOptions.headers['X-Zenfolio-Token'] = token;
                createSoapClient(req, res, function (err, client) {
                    configData.soapClient = client;
                    callback(client);
                });
                console.log('Authenticated and zentoken set ');
                log('Authenticated and zentoken set ');
            }
        }

        setZenFolioMethod = function () {
            requestInfo.data.method = arguments[0];
        }

        setContentType = function () {
            requestInfo.reqOptions.headers['Content-Type'] = arguments[0];
        }

        setContentLength = function () {
            requestInfo.reqOptions.headers['Content-Length'] = arguments[0];
        }

        setAuthToken = function () {
            requestInfo.reqOptions.headers['X-Zenfolio-Token'] = arguments[0];
        }

        setProtocol = function () {
            configData.protocol = arguments[0];
        }

        /**
         * @access private
         * Set the request paramaters for JSON RPC communication
         * In JSON RPC way of communicating to ZF API, there are three parameters
         * 1. Method Name of the service like 'LoadGroup'
         * 2. Parameters that needs to be passed to the method, this method sets those parameters
         * 3. reqId - A unique id to identify the transaction, not set here
         */
        setRequestParams = function (args) {
            args = JSON.parse(args);
            var reqData = '[';
            for (var data in args) {
                reqData += '"' + args[data] + '", ';
            }
            reqData += reqData.substring(0, reqData.length - 1) + ']';
            requestInfo.data.params = args;
            requestInfo.data.id = Math.random();
        }


        /**
         * @access private
         * @param method {string} - ZFAPI method name
         * @param data - Data in JSON format that needs to be sent to server
         * @param callback function to be executed
         *
         * Post the request to zfapi webservices
         *
         */
        post = function (req, res, method, data, callback) {
            setZenFolioMethod(method);
            setRequestParams(data);
            setContentType('application/json');
            setContentLength(JSON.stringify(requestInfo.data).length);
            var request = https.request(requestInfo.reqOptions, function (result) {
                // log('POST STATUS Code: ' + result.statusCode);
                //  log('RES HEADERS: ' + JSON.stringify(result.headers));

                callback(req, res, result);
            });

            request.on('error', function (e) {
                utils.errLog(req, res, 'JSZenfolio.post.1', 'Error from Request ID- ' + requestInfo.data.id + ': ' + e.message, false);
            });

            request.write(JSON.stringify(requestInfo.data));
            request.end();
        }

        /**
         * Upload files to gallery
         * @access public
         * @param  uploadURL {string} the uploadURL of photoset (gallery/collection)
         * @param  filePath (array) array of file path name
         * @param  title of file
         * @param  callback - will return err and response
         * e.g., files = {['filename', 'optionalTitle'], ['/home/abc.jpg', 'My Nice Flower'], [/home/def.jpg]}
         *
         */

// This is how the upload post should look like, if captured over wire
// POST /demouser/p340540780/upload.ushx HTTP/1.1<cr><lf>
// Host: up.zenfolio.com<cr><lf>
// User-Agent: Upload Sample Application<cr><lf>
// Content-Type: multipart/form-data; boundary=8a47a5f4dc58498da616<cr><lf>
// Content-Length: 1290606<cr><lf>
// X-Zenfolio-Token: 6cA3p2kbk1MvGplnQ-NgGtaKf1B3PaDPqOOCORpR/cnyAAKoeyGz=<cr><lf>
// <cr><lf>
// --8a47a5f4dc58498da616<cr><lf>
// Content-Disposition: form-data; name="file"; filename="test.jpg"<cr><lf>
// Content-Type: image/jpeg<cr><lf>
// <cr><lf>
// [binary file data]<cr><lf>
// --8a47a5f4dc58498da616<cr><lf>
// Content-Disposition: form-data; name="file_modified"<cr><lf>
// <cr><lf>
// Fri, 28 Jan 2005 13:15:04 GMT<cr><lf>
// --8a47a5f4dc58498da616--<cr><lf>


        /**
         * Upload files to gallery
         * @access public
         * @param  uploadURL {string} the uploadURL of photoset (gallery/collection)
         * @param  filePath (array) array of file path name
         * @param  title of file
         * @param  callback - will return err and response
         * e.g., files = {['filename', 'optionalTitle'], ['/home/abc.jpg', 'My Nice Flower'], [/home/def.jpg]}
         *
         */

// This is how the upload post should look like, if captured over wire
// POST /demouser/p340540780/upload.ushx HTTP/1.1<cr><lf>
// Host: up.zenfolio.com<cr><lf>
// User-Agent: Upload Sample Application<cr><lf>
// Content-Type: multipart/form-data; boundary=8a47a5f4dc58498da616<cr><lf>
// Content-Length: 1290606<cr><lf>
// X-Zenfolio-Token: 6cA3p2kbk1MvGplnQ-NgGtaKf1B3PaDPqOOCORpR/cnyAAKoeyGz=<cr><lf>
// <cr><lf>
// --8a47a5f4dc58498da616<cr><lf>
// Content-Disposition: form-data; name="file"; filename="test.jpg"<cr><lf>
// Content-Type: image/jpeg<cr><lf>
// <cr><lf>
// [binary file data]<cr><lf>
// --8a47a5f4dc58498da616<cr><lf>
// Content-Disposition: form-data; name="file_modified"<cr><lf>
// <cr><lf>
// Fri, 28 Jan 2005 13:15:04 GMT<cr><lf>
// --8a47a5f4dc58498da616--<cr><lf>

        uploadSimple = function (req, res, uploadURL, filePath, callback) {
            if (typeof(callback) != 'function') {
                callback = function (err, result) {
                    if (err) {
                        utils.errLog(req, res, 'JSZenfolio.uploadSimple.1', err, false);
                    }
                };
            }

            //check if filepath is provided
            if (!filePath || filePath === '') {
                callback('No Files specified for upload', null);
                return;
            }
            if (!fs.existsSync(filePath)) {
                callback(filePath + ' does not exists', null);
            }
            ;

            var fileName = getZenFolioArtificatID('/', filePath);

            uploadURL += '?filename=' + fileName;

            var crlf = '\r\n'
                , contentLength = 0
                // , boundaryCode = '--' + Math.random()
                , uploadByteArray = []  //this array stores the lines that needs to be pushed
                // , boundary = '--' + boundaryCode + crlf
                , fileStats
                ;


            // we need to convert this to binary for sending,
            // for now store the path, at upload, we convert it
            var fileInfo = {'filePath': filePath};
            //override the length attribute to so we can use it in a loop to calculate the content legth
            fileInfo.length = fs.statSync(filePath).size;

            uploadByteArray.push(fileInfo);

            for (var i = 0; i < uploadByteArray.length; i++) {
                contentLength += uploadByteArray[i].length;
            };
            setRequestHeadersForUpload(req, res, uploadURL);
            setContentType(getMimeType(fileName));
            setContentLength(contentLength);
            var request = http.request(requestInfo.reqOptions, function (response) {
                log('Upload - Status Code: ' + response.statusCode);

                response.setEncoding('utf8');

                var responseString = ''
                response.on('data', function (chunk) {
                    responseString += chunk;
                });

                response.on('end', function () {
                    callback(null, response, responseString);
                });

            });

            request.on('error', function (e) {
                utils.errLog(req, res, 'JSZenfolio.upload.1', 'Error from Request ID- ' + requestInfo.data.id + ': ' + e.message, false);
                callback(e, null);
            });

            for (var i = 0; i < uploadByteArray.length; i++) {
                var uploadByteLine = uploadByteArray[i];
                if (typeof(uploadByteLine) === 'string') {
                    log(uploadByteLine);
                    request.write(uploadByteLine);
                } else {
                    request.write(fs.readFileSync(uploadByteLine.filePath));
                }
            }
            request.end();
        }

        /**
         * This method adds the user agents and other options from url to the header
         */
        setRequestHeadersForUpload = function (req, res, uploadURL) {
            initializeRequestHeaders(req, res, uploadURL);
            requestInfo.reqOptions.headers['X-Zenfolio-Token'] = configData.zenToken;
        };

        getMimeType = function (filePath) {
            var ext = filePath.replace(/.*[\.\/\\]/, '').toLowerCase();
            return mimeTypes[ext];
        };

        /**
         * @access public
         * @param setupArgs {JSON object} look at configData that is accesible
         * @param callback function - see description
         *
         * this method authenticates
         * then creates a client to zenfolio API webservices
         * then executes the commands passed in the callback function
         * the callback function gets the client that was created
         * using that client that was passed, any method can be called
         * the supported methods are here
         * http://api.zenfolio.com/api/1.8/zfapi.asmx
         *
         */

        executeCommands = function (req, res, setupArgs, callback) {
            for (var propName in setupArgs) {
                configData[propName] = setupArgs[propName];
            }
            initializeRequestHeaders(req, res, getZenFolioFullAPIURL());
            //if loginName and password is set authenticate
            if (configData.loginName !== '' && configData.password !== '') {
                authenticate(req, res, callback);
            } else {
                utils.errLog(req, res, 'JSZenfolio.execiteComands.1', 'Error from Request ID- ' + requestInfo.data.id + ': Login or Password = ""', false);
            }
        }

        /**
         * @access public
         * @params zftype {string} - ZenFolioType enum value
         * @params url {string}- 'http://flowerarchitect.zenfolio.com/f542321495',
         * @return {string} - artificat id
         *
         * Given a page url, this method finds the id of that artifact
         */
        getZenFolioArtificatID = function (zftype, url) {
            if (!url) return null;
            var arr = url.split(zftype);
            var ret = arr[arr.length - 1]
            return ret;
        }

        /**
         * @access public
         * This JSZenfolio wrappers config data
         */

        getConfigData = function () {
            return configData;
        };


        return {
            getConfigData: getConfigData
            , getID: getZenFolioArtificatID
            , executeCommands: executeCommands
            , Type: ZenFolioType
            , upload: uploadSimple
        };

    })();

    module.exports = JSZenFolio;

})();



