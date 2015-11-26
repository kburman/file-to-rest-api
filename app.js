var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var mongo = require('mongodb')
var monk = require('monk')
//
// USER VARIABLE
//

var mongodb_host = 'localhost:27017'
var mongodb_dbname = 'testme'
//
// END
//
app.set('port', (process.env.PORT || 5000));
//var db = monk("mongodb://testuser:admin12345@ds035693.mongolab.com:35693/testforapi", {native_parser: true})
var db = monk(mongodb_host + '/' + mongodb_dbname)
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.set('view engine', 'jade')
app.use(function (req, res, next) {
	req.db = db
	next()
})
app.use('/api/', require('./api_router.js'))

app.use('/css', express.static('./public/css'))
app.use('/js', express.static('./public/js'))
app.use('/fonts', express.static('./public/fonts'))

app.use('/ui', require('./ui_router.js'))
app.use(function (req, res) {
	res.status(404).send('page not found')
})

app.listen(app.get('port'), function () {
	console.log('Server started on port : ', app.get('port'))
})
