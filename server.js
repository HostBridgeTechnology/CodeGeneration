var express = require('express');
var app = express();
var router = express.Router();

var UploadController = require('./src/upload/UploadController');
var CopybookController = require('./src/copybook/CopybookController');
var FieldGenController = require('./src/fieldgen/FieldGenController');

app.use('/upload', UploadController);
app.use('/copybook', CopybookController);
app.use('/fieldgen', FieldGenController);
app.use('/', function (req, res) {
    res.sendFile(__dirname + "/index.html");
})

/*
 * Default route
 */
// app.use('*', function (req, res) {
//     res.redirect('/');
//     // return res.end();
// });

var port = process.env.PORT || 3000;

var server = app.listen(port, function() {
    console.log('Express server listening on port ' + port);
    const all_routes = require('express-list-endpoints');
    console.log(all_routes(app));
});

module.exports = app;
module.exports = router;