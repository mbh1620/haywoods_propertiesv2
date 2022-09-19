var express = require('express');
const property = require('../models/property');
var router = express.Router();
const createNewContract = require('../scripts/contractCreator').createNewContract

var Property = require("../models/property");
var Tenant = require("../models/tenant");

function createNewTenant(req, res, next) {

    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var mobile_number = req.body.mobile_number;
    var home_number = req.body.house_number;
    var propid = req.params.id;
    var date_moved_in = req.body.date_moved_in;
    var contract_type = req.body.contract_type

    var newTenant = {
        firstname: firstname,
        lastname: lastname,
        email: email,
        mobile_number: mobile_number,
        home_number: home_number,
        property: propid,
        date_moved_in: date_moved_in,
        CurrentTenant: true,
    }

    req.newTenant = newTenant

    Tenant.create(newTenant, function (err, _tenant) {
        if (err) {
            console.log(err);
        } else { }
        Property.findById(propid, function (err, foundProperty) {
            foundProperty.Tenants.push(_tenant);
            req.property = foundProperty
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
    var user = req.user
    console.log("USER")
    console.log(user)
    if(req.body.generate_contract != 'undefined'){
        
        createNewContract(req.newTenant, user, req.property)        
    }
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