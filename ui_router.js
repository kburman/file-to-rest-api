var express = require('express')
var router = express.Router()
var multer = require('multer')
var uploads = multer({dest: 'uploads/'})
var fs = require('fs')
var fstcsv = require('fast-csv')
var rstr = require('randomstring')

router.get('/add-entry', function (req, res, next) {
	res.render('add.jade')
})

router.get('/browse', function (req, res) {
	req.db.get('fileinfo').find({}, function (err, docs) {
		if (docs) {
			res.render('browse.jade', {servicelst: docs})
		} else {
			res.status(501).send('Error connecting to DB')
		}
	})
})

router.get('/update/:id', function (req, res, next) {
	req.db.get('fileinfo').findOne({'_id': req.params.id}, function (err, doc) {
		if (err) {
			res.send('error finding entry')
		} else {
			res.render('update.jade', doc)
		}
	})
})

router.post('/update/:id', uploads.single('servicefile'), function (req, res, next) {
	console.log('updateing record : ', req.params.id)
	req.db.get('fileinfo').findOne({'_id': req.params.id}, function (err, doc) {
		if (err) {
			res.send('error finding entry')
		} else {
			/// ------------
			req.db.get(doc.colname).remove({}, function (err) {
				if(err) {
					res.send('cant clear older entries')
				} else {
					var doccount = 0
					fstcsv.fromPath(req.file.path, {headers: true})
						.on('data', function (data) {
							req.db.get(doc.colname).insert(data)
							doccount += 1
						})
						.on('end', function () {
							res.send('Sucessfully inserted <strong>' + doccount + '</strong> rows')
						})
						.on('error', function (err) {
							res.send('Error while parsing csv ' + JSON.stringify(err))								
						})
				}
			})
			/// -----------
		}
	})
})

router.get('/delservice/:id', function (req, res, next) {
	req.db.get('fileinfo').findOne({'_id': req.params.id}, function (err, doc) {
		if (doc) {
			req.db.get('fileinfo').remove({_id: doc._id}, function (err) {
				if (err) {
					res.send('cant find fileinfo')
				} else {
					req.db.get(doc.colname).remove({}, function (err) {
						if (err) {
							res.send('error removing csv file content')
						} else {
							res.send('deleted successful')
						}
					})
				}
			})
		} else {
			res.send('Sorry but we cant find out db entry for it')
		}
	})
})

router.post('/add-entry', uploads.single('servicefile'), function (req, res, next) {
	if (req.file && req.body.servicename && req.body.searchid) {

		req.db.get('fileinfo').findOne({'servicename': req.body.servicename}, function (err, doc) {
			if (doc) {
				res.render('add.jade', {error_msg: 'servicename ' + req.body.servicename + ' already exist.'})
			} else {
				var obj = {
					'servicename': req.body.servicename,
					'colname': rstr.generate(7),
					'filetype': 'csv',
					'enabled': true,
					'searchBy': req.body.searchid.split(',')
				}
				req.db.get('fileinfo').insert(obj, function (err) {
					if (err) {
						res.render('add.jade', { error_msg: 'Something wrong with DB'})
					} else {
						var doccount = 0
						fstcsv.fromPath(req.file.path, {headers: true})
							.on('data', function (data) {
								req.db.get(obj.colname).insert(data)
								doccount += 1
							})
							.on('end', function () {
								res.render('add.jade', { info_msg: 'Sucessfully inserted <strong>' + doccount + '</strong> rows'})
							})
							.on('error', function (err) {
								req.db.get('fileinfo').remove({'_id': obj['_id']}, function (err) {
									if (err) {
										res.render('add.jade', { error_msg: 'Something wrong with DB and file.'})
									} else {
										res.render('add.jade', { error_msg: 'Error reading file'})
									}
								})
								
							})
					}	
				})
			}
		})


		
	} else {
		res.render('add.jade', { error_msg: 'All field are required'})
	}
})



router.use(function (req, res) {
	res.redirect('/ui/browse/')
})

router.use(function (err, req, res, next) {
	res.send('Something went wrong while processing ' +  JSON.stringify(err))
	console.log(err)
})


module.exports = router