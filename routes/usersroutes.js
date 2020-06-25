// Routes for users, Login, Create, Delete, Edit etc...

var express = require('express');
var router = express.Router();
var LocalStrategy = require("passport-local");
var passport = require("passport");
var passportLocalMongoose = require("passport-local-mongoose");

var User = require("../models/user");

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

module.exports = router;
