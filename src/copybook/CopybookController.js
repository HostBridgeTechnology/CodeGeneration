var waterfall = require('async-waterfall');
var formidable = require('formidable');
var uuidv4 = require('uuid/v4');
var Archiver = require('archiver');
const { exec } = require('child_process');
const { parseString } = require('xml2js');
var express = require('express');
var router = express.Router();

var fs = require('fs');

var mustache = require('mustache');
var generate = require('../common/generate');

var copybookSavePath = '/home/ec2-user/copybooks/';

var t = __dirname.split(/[\/\\]/);
t.splice(-1,1);
var parent = t.join('/');

/*
 * Read the templates we will use for copybook to code
 */
var copybookToCode = fs.readFileSync(__dirname + '/copybookToCode.template').toString();

/*
 * Initialize the template object
 */
var view = {
    files : [],
    errors : ''
}

router.get('/', function (req, res) {
    var rendHtml = mustache.render(copybookToCode, view);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(rendHtml);
    view.files = [];
    return res.end();
});

router.get('/download/:id/:name', function (req, res) {
    res.download(`${copybookSavePath}${req.params.id}.zip`, `${req.params.name}.zip`);
});

router.all('/upload', function (req, res) {

    waterfall([getCopybook, generateXml, parseXml, generateJs], function (err, file, zip) {
        if (err) {
            view.errors += err.toString()
        }
        if (zip) {
            zip.finalize();
        }
        if (file) {
            file.zipsize = (fs.statSync(file.zipName).size/1024).toFixed(1);
            view.files.push(file);
        }

        res.redirect('/copybook');
    });
    
    function getCopybook (callback) {
        var zip = Archiver('zip');
        var uuid = uuidv4();
        var zipName = `${copybookSavePath}${uuid}.zip`
        var output = fs.createWriteStream(zipName);
        var form = new formidable.IncomingForm();
    
        form.parse(req, function (err, fields, postedFiles) {
            if (err) {
                err.myMessage = 'form.parse: error in uploading file';
                view.errors = err.myMessage;
                console.dir(err);
                return callback(err);
            }
            var file = {
                uuid : uuid,
                path : postedFiles.copybookIn.path,
                name : postedFiles.copybookIn.name,
                prefix : postedFiles.copybookIn.name.split('.')[0],
                size : postedFiles.copybookIn.size,
                zipName : zipName,
                js : fields.js ? true : false,
                cob : fields.cob ? true : false,
                v1 : fields.v1 ? true : false,
                v2 : fields.v2 ? true : false,
                v3 : fields.v3 ? true : false,
                v4 : fields.v4 ? true : false,
                iXml : fields.xml ? true : false,
                icb : fields.icb ? true : false,
                v2Compatibility : fields.v2Compatibility ? "on" : "off" 
            };
            zip.pipe(output);
            if (file.icb) {
                zip.file(file.path, { name: file.name });
            }

            callback(null, file, zip);
        });
    }

    function generateXml(file, zip, callback) {

        exec(`java -cp cb2xml.jar net.sf.cb2xml.Cb2Xml ${file.path} `, {cwd: parent + '/cli', shell: true}, (error, stdout, stderr) => {
            if (error || stderr.length > 50) {
                console.log(`STDERR\n${stderr}`);
                file.xmsg = stderr;
                return callback(file.xmsg, file, zip);
            } else {
                file.xml = stdout;
                if (file.iXml) {
                    zip.append(file.xml, { name: `${file.prefix}.xml`});
                }
                callback(null, file, zip);
            }
        });
    }

    function parseXml(file, zip, callback) {
        parseString(file.xml, function (err, result) {
            if (err) {
                console.error(`Error in converting XML to jsObject: ${err}`);
                return callback(err, file, zip);
            }
            
            file.parsed = result.copybook;

            callback(null, file, zip);
        });
    }

    function generateJs(file, zip, callback) {
        generate.getJs(file, zip);
        callback(null, file, zip);
    }
});

module.exports = router;