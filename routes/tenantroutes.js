var express = require('express');
var router = express.Router();

var Property = require("../models/property");
var Tenant = require("../models/tenant");

function createNewTenant(req, res, next) {

    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var mobile_number = req.body.mobile_number;
    var home_number = req.body.house_number;
    var animals = req.body.animals;
    var propid = req.params.id;
    var date_moved_in = req.body.date_moved_in;

    console.log(date_moved_in)

    var newTenant = {
        firstname: firstname,
        lastname: lastname,
        email: email,
        mobile_number: mobile_number,
        home_number: home_number,
        animals: animals,
        property: propid,
        date_moved_in: date_moved_in,
        CurrentTenant: true,

    }

    Tenant.create(newTenant, function (err, _tenant) {
        if (err) {
            console.log(err);
        } else { }
        Property.findById(propid, function (err, foundProperty) {
            foundProperty.Tenants.push(_tenant);
            foundProperty.save(function (err, data) {
                if (err) {
                    console.log(err);
                } else {
                    next();
                }
            })
        })
    });


}

//============================================
//              Tenant Routes
//============================================
//Tenants are associated to properties which is why the route starts with "properties"

// Create Tenant
router.post("/properties/:id/new-tenant", createNewTenant, function (req, res) {
    res.redirect("/user/"+req.body.userId + "/manage/" + req.params.id);
})

// Delete Tenant
router.delete("/properties/:id/new-tenant/:tid", function (req, res) {
    console.log(req.body.userId)
    Tenant.findByIdAndRemove(req.params.tid, function (err) {
        res.redirect("/user/"+req.body.userId + "/manage/" + req.params.id);
    })

})

module.exports = router;