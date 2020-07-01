// Routes for Users, Login, Create, Delete, Edit etc...

var express = require('express');
var router = express.Router();
var LocalStrategy = require("passport-local");
var passport = require("passport");
var passportLocalMongoose = require("passport-local-mongoose");
var fs = require("fs");
var axios = require('axios');
var cheerio = require('cheerio');
var schedule = require('node-schedule');

var User = require("../models/user");
var Property = require("../models/property")

//PASSPORT SETUP
router.use(passport.initialize());
router.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

router.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
});

//============================================
//              Users Routes
//============================================

//USERS SIGNUP/Login/Logout ROUTES

router.get("/register", function (req, res) {
    res.render("register.ejs");
});

router.post("/register", function (req, res) {
    User.register(new User({ username: req.body.username, firstname: req.body.firstname, lastname: req.body.lastname, email: req.body.email }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register.ejs");
        } 

        //Create empty portfolio values from January until present month

        //var current month
        var d = new Date();

        var current_month = d.getMonth();
        
        //We now need to make a loop for how many months we have passed since january 

        for(var i = 0; i < current_month; i++){ 
            //fill these months with empty values for portfolio value
            
            //Clean up later by adding in year and month but not neccesary at this point.
            var PortFolioValue = {
                year: null,
                month: null,
                value: null
            }

            /* var totalRentIncomeData: [{
                year: String, 
                month: String, 
                value: Number
            }] */

            var totalRentIncomeData = {
                year: null, 
                month: null, 
                value:null
            }

            user.PortfolioValue.push(PortFolioValue);
            user.totalRentIncomeData.push(totalRentIncomeData);
        }

        User.findByIdAndUpdate(user._id, user, function(err, updatedUser){
            if(err){
                console.log(err);
            } else {
                passport.authenticate("local")(req, res, function () {
                    update_portfolio(user._id, function(){
                        res.redirect("/");
                    }) 
                })
            }
        })
    })
});

router.get("/login", function (req, res) {
    res.render("login.ejs");
})

router.post("/login", passport.authenticate("local", {
    successRedirect: "/properties",

    failureRedirect: "/login"

}), function (req, res) {

});

router.post("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
})

//Account Settings routes

router.get("/user/:id", function (req, res) {
    var userid = req.params.id
    User.findById(req.params.id, function (err, founduser) {
        if (err) {
            console.log(err);
        } else {
            res.render("settings.ejs", { user: founduser })
        }
    })

})

//Route for showing the main manage dash for user

router.get("/user/:id/manage", function (req, res) {

    User.findById(req.params.id).populate('properties').exec(function (err, founduser) {
        if (err) {
            console.log(err);
        } else {
            res.render("manage.ejs", { property: founduser.properties });
        }
    })
})

//Route for getting the manage page for property

router.get("/user/:id/manage/:propid", function (req, res) {
    var userid = req.params.id
    var propid = req.params.propid;
    var images = []
    var currentPrice;
    var url = 'https://www.zoopla.co.uk/property/';



    Property.findById(propid).populate("Tenants").exec(function (err, foundProperty) {
        if (err) {
            console.log(err);
        } else {
            fs.readdir("uploads/" + req.params.propid, (err, files) => {
                if (err) {
                    console.log(err);
                    res.render("show.ejs", { property: foundProperty, images: images })
                }
                if (files !== undefined) {
                    for (const file of files) {
                        images.push(file);
                    }
                }


                var d = new Date();
                var month = new Array();
                month[0] = "January";
                month[1] = "February";
                month[2] = "March";
                month[3] = "April";
                month[4] = "May";
                month[5] = "June";
                month[6] = "July";
                month[7] = "August";
                month[8] = "September";
                month[9] = "October";
                month[10] = "November";
                month[11] = "December";
                var themonth = month[d.getMonth()];
                console.log(foundProperty)
                var theyear = d.getFullYear();

                console.log(foundProperty.estimatedValue.length)
                if (foundProperty.estimatedValue[0] === undefined || foundProperty.estimatedValue === 0 || foundProperty.estimatedValue[foundProperty.estimatedValue.length - 1].month !== themonth) {
                    url = url + foundProperty.zoopla_id;
                    console.log(url);
                    axios(url)
                        .then(response => {
                            const html = response.data;
                            const $ = cheerio.load(html);
                            const estimatedPrice = $('.pdp-estimate__price');
                            console.log("Scraped from Zoopla")
                            currentPrice = estimatedPrice.text();
                            console.log(currentPrice);

                            //If the property does not have a m in the string then do the following



                            //If the property is valued at 1m or above
                            currentPrice = currentPrice.substr(currentPrice.indexOf('£') + 1, currentPrice.indexOf('m'));
                            currentPrice = currentPrice.split('m')[0];

                            console.log(currentPrice);
                            currentPrice = currentPrice.replace(',', '');
                            currentPrice = currentPrice.replace(',', '');
                            currentPrice = currentPrice * 1E6;



                            console.log(currentPrice);

                            function pushNewprop(callback) {
                                foundProperty.estimatedValue.push({
                                    year: theyear,
                                    month: themonth,
                                    price: currentPrice
                                })
                                callback();
                            }

                            pushNewprop(function (err) {
                                Property.findByIdAndUpdate(propid, foundProperty, { new: true }, function (err, updatedProperty) {
                                    if (err) {
                                        console.log(err)
                                    } else {
                                        console.log("PROPERTY UPDATED!!!!")
                                        console.log(updatedProperty)
                                        res.render("manageproperty.ejs", { property: updatedProperty, images: images });
                                    }
                                })
                            })

                        })

                } else {
                    res.render("manageproperty.ejs", { property: foundProperty, images: images });
                }

            })
        }
    })
})

//Route for updating the estimated value and rent

router.put("/user/:id/manage/:propid", function (req, res) {

    Property.findByIdAndUpdate(req.params.id, req.body.property, function (err, updatedProperty) {
        if (err) {
            console.log("error has occurred");
        } else {
            console.log(req.body.property);
            res.redirect("/properties");
        }
    })
})

//Route for adding a maintenance job to the house
router.put("/user/:id/properties/:propid/job", function (req, res) {
    jobname = req.body.jobname;
    jobbody = req.body.jobbody;
    jobdate = req.body.jobdate;


    id = req.params.id;
    Property.findById(req.params.propid, function (err, updatedProperty) {
        if (err) {
            console.log("error has occurred");
        } else {
            updatedProperty.maintenance_item.push({
                Name: jobname,
                Detail: jobbody,
                Finish_Date: req.body.jobdate
            })
            console.log(updatedProperty);
            Property.findByIdAndUpdate(req.params.propid, updatedProperty, function (err, updatedProperty) {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect("/user/" + id + "/manage/" + updatedProperty.id);
                }
            })

        }
    })
})

//Router for displaying users properties
router.get("/user/:id/properties", function (req, res) {
    var userid = req.params.id
    //Add populate function HERE!!!!
    User.findById(req.params.id).populate('properties').exec(function (err, founduser) {
        if (err) {
            console.log(err);
        } else {
            res.render("usersproperties.ejs", { founduser: founduser });
        }
    })
})

module.exports = router;
