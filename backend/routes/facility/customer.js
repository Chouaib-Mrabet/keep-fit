var mongoose = require('mongoose');
var router = require('express').Router();

//var auth = require('../../helpers/auth');

var Customer = mongoose.model('Customer');
var Reservation = mongoose.model('Reservation');
var Facility = mongoose.model('Facility');

/*
 * Read customer data by customer id / email / phone no
 * permission: facility owner, if the customer(s) have reservation in his/her facility(s)
 * required data: Authentication token
 * optional data on query string: id, email, phone (Atleast one is required)
 */
router.get('/:facilityId/customer', function(req, res, next) { // remove auth.required
	// if regEx of params do not match procceed to next function
	var regExObjectId = /^[a-f\d]{24}$/i;
	if (!regExObjectId.test(req.params.facilityId)) return next();

	// Authorize if user is the admin of the facility
	Facility.findOne({
		_id: req.params.facilityId,
		admin: req.user.id
	}).then(function(facility) {
		if (!facility) return res.sendStatus(401);

		// Create the database query object depending upon parameter passed
		let query = {};
		if (req.query.phone) query.phone = req.query.phone;
		if (req.query.email) query.email = req.query.email;
		if (req.query.id) query._id = req.query.id;

		if (!Object.keys(query).length) return res.sendStatus(400);

		// Find customer using phone no provided
		Customer.findOne(query).then(function(customer) {
			if (!customer) return res.sendStatus(404);

			// Authorize only if the customer has reservation in that facility
			Reservation.find({
				facility: req.params.facilityId,
				customer: customer._id
			}).then(function(reservations) {
				if (!reservations.length) return res.sendStatus(401);

				return res.json({customer: customer.getUserJSON()})
			}).catch(next);
		}).catch(next);
	}).catch(next);
});

module.exports = router;
