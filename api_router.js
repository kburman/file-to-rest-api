var express = require('express')
var router = express.Router()

router.use('/:service/*', function (req, res, next) {
	req.db.get('fileinfo').findOne({'servicename': req.params.service}, function (err, doc) {
		if (doc) {
			if (doc.enabled) {
				var p = req.params['0'].split("/")
				console.log(p)
				var findObj = {}
				for (var i = 0; i < p.length; i+= 2) {
					if (doc.searchBy.indexOf(p[i]) >= 0) {
						findObj[p[i]] = p[i+1]
					}
				}
				req.db.get(doc.colname).find(findObj, function (err, docs) {
					res.json(docs || {})
				})
			} else {
				res.status(404).json({'err': 'this service is disabled.'})
			}
		} else {
			res.status(404).json({'err': 'no service of this name.'})
		}
	})
})

router.use(function (req, res) {
	res.status(404).json({'err': 'we cant find what you want to do'})
})

router.use(function (err, req, res, next) {
	res.json({'err': 'we cant find what you want to do'})
})


module.exports = router