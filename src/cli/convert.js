var fs = require('fs');
const { exec } = require('child_process');
const { parseString } = require('xml2js');
var generate = require('../common/generate');

var passed = require('minimist')(process.argv.slice(2));

var input = {
    copybook : passed.input,
    outfile : passed.outprefix ? passed.outprefix : "./out",
    js : passed.js ? true : false,
    cob : passed.cob ? true : passed.js ? false : true,
    v1 : passed.v1 ? true : false,
    v2 : passed.v2 ? true : false,
    v3 : passed.v3 ? true : false,
    v4 : passed.v4 ? true : passed.v1 || passed.v2 || passed.v3 ? false : true,
    xml : passed.xml ? true : false,
    v2Compatibility : passed.v2Compatibility ? "on" : "off",
    cli : true
}

if (input.copybook === undefined) throw SyntaxError("Input COBOL copybook required: --input input.cob");

var t = __dirname.split(/[\/\\]/);
t.splice(-1,1);
var parent = t.join('/');

generateXml();

function generateXml() {
    exec(`java -cp cb2xml.jar net.sf.cb2xml.Cb2Xml "${input.copybook}" `, {cwd: __dirname, shell: true}, (error, stdout, stderr) => {
        if (error || stderr.length > 50) {
            console.log(`STDERR\n${stderr}`);
            console.dir(error);
            throw Error("Unable to parse copybook");
        } else {
            if (input.xml) {
                fs.writeFileSync(input.outfile + '.xml', stdout);
            }

            parseXml(stdout);

        }
    });
}

function parseXml (xml) {
    parseString(xml, function (err, result) {
        if (err) {
            console.error(`Error in converting XML to jsObject: ${err}`);
            throw Error("Unable to parse XML");
        }
        input.parsed = result.copybook;

        generate.getJs(input, null);
    });
}
