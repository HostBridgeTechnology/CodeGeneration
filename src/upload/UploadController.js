var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var fs = require('fs');

router.all('/', function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write('<form action="/upload/file" method="post" enctype="multipart/form-data">');
    res.write('<input type="file" name="filetoupload"><br>');
    res.write('<input type="submit">');
    res.write('</form>');
    console.log('Listening on port 8080!');
    return res.end();
});

router.all('/file', function (req, res) {
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
        var oldpath = files.filetoupload.path;
        var newpath = 'C:/temp/' + files.filetoupload.name;
        fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('<form action="/upload/file" method="post" enctype="multipart/form-data">');
            res.write('<input type="file" name="filetoupload"><br>');
            res.write('<input type="submit">');
            res.write('</form>');
            res.write('File ' + files.filetoupload.name + ' uploaded and moved!');
            console.log('File uploaded and moved!');
            return res.end();
        });
    });
});

module.exports = router;