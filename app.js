var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");
var axios = require('axios');
var cheerio = require('cheerio');
var schedule = require('node-schedule');

// ROUTE IMPORTS 
var propertyroutes = require('./routes/propertyroutes');
var tenantroutes = require('./routes/tenantroutes');
var usersroutes = require('./routes/usersroutes');
var graphingroutes = require('./routes/graphingroutes');

//Model includes

var Tenant = require("./models/tenant");
var User = require("./models/user");

//app config
app.use(methodOverride("_method"));

app.use(require("express-session")({
    secret: "Once again Rusty wins the cutest dog!",
    resave: false,
    saveUninitialized: false
}));

//=============================================================
app.set('views', './views');

app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname + "/public"));

//Database connection

mongoose.connect("mongodb://matthew:matthew12@ds129796.mlab.com:29796/heroku_cx76x142", { useNewUrlParser: true, useFindAndModify: false });
app.use(bodyParser.urlencoded({ extended: true }));


//=====================================================
//
//          Routes (need to go in separate files)
//
//=====================================================

app.use("/",usersroutes);

app.use("/",propertyroutes);

// index route
app.get("/", function (req, res) {
    res.render("home.ejs");
});

//USERS PROPERTIES ROUTES
//Index

app.get("/user/:id/properties", function (req, res) {
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

//Function for updating total rent income

function update_rent_total_income(user_id, next){
    User.findByIdAndUpdate(user_id).populate('properties').exec(function (err, founduser){
        if(err){
            console.log(err);
        } else {
            //Total all the current months rent income from each house and then sum it and push to total rent data.
            var total_rent_income = 0;
            var CurrentYear;
            var CurrentMonth;

            console.log(founduser);

            var d = new Date();

            CurrentYear = d.getFullYear();
            CurrentMonth = d.getMonth();
            
            for(var i = 0; i < founduser.properties.length; i++){
                if(!isNaN(founduser.properties[i].price))
                total_rent_income = total_rent_income + founduser.properties[i].price;
            }
            
            /* 
            totalRentIncomeData: [{
                year: String, 
                month: String, 
                value: Number
            }]
            */

            var totalRentIncomeData = {
                year: CurrentYear,
                month: CurrentMonth,
                value: total_rent_income
            }

            founduser.totalRentIncomeData.push(totalRentIncomeData);

            User.findByIdAndUpdate(founduser._id, founduser, function(err, updatedUser){
                if(err){
                    console.log(err);
                } else {
                    next();
                }
            })
        }
    })
}

//Route for recalculating Rent Value 

app.post("/calculate_rent", function (req,res){
    update_rent_total_income(req.body.id, function(){
        res.redirect("/user/" + req.body.id + "/manage");
    })
})


//Function for updating PortFolio Value 

function update_portfolio(user_id, next) {
    User.findById(user_id).populate('properties').exec(function (err, founduser) {
        if (err) {
            console.log(err)
        } else {
            var portfolio_total = 0;
            var CurrentYear;
            var CurrentMonth;
            //Code for updating the users Portfolio value, rent etc...
            for (var i = 0; i < founduser.properties.length; i++) {
                if (typeof founduser.properties[i].estimatedValue !== 'undefined') {
                    if (typeof founduser.properties[i].estimatedValue[founduser.properties[i].estimatedValue.length - 1].price !== 'undefined') {
                        portfolio_total = portfolio_total + founduser.properties[i].estimatedValue[founduser.properties[i].estimatedValue.length - 1].price;
                        console.log(portfolio_total);
                        CurrentYear = founduser.properties[0].estimatedValue[founduser.properties[i].estimatedValue.length - 1].year;
                        CurrentMonth = founduser.properties[0].estimatedValue[founduser.properties[i].estimatedValue.length - 1].month;
                    }
                } else {
                    console.log("estimated value for this property is undefined");
                }
            }

            var CurrentPortFolioValue = {
                year: CurrentYear,
                month: CurrentMonth,
                value: portfolio_total
            }

            founduser.PortfolioValue.push(CurrentPortFolioValue);

            console.log(founduser)


            User.findByIdAndUpdate(founduser._id, founduser, function (err, updatedUser) {
                if (err) {
                    console.log(err)
                } else {
                    next();
                }
            });
        }
    })
}


//Route for recalculating PortFolio Value
//Need to add in the correct month by deleting the previously populated current month.

app.post("/recalculate", function (req,res){
    console.log(req.body.id)

    update_portfolio(req.body.id, function(){
        res.redirect("/user/" + req.body.id + "/manage");
    })
})


app.get("/user/:id/manage", function (req, res) {

    User.findById(req.params.id).populate('properties').exec(function (err, founduser) {
        if (err) {
            console.log(err);
        } else {
            res.render("manage.ejs", { property: founduser.properties });
        }
    })
})

//Function used for updating property rent value data 

function prop_rent_val_update(propid, next) {

    //first find prop by id

    Property.findById(propid, function(err, foundProperty){
        if(err){
            console.log();
        } else {
            var d = new Date();
            var month = d.getMonth();
            var year = d.getFullYear();


            //Get current property rent value

            var rent = foundProperty.price;

            /* var rentData: [{
                year: String, 
                month: String,
                price: Number
            }], */

            var rentData = {
                year: year,
                month:month,
                price:rent
            }

            foundProperty.rentData.push(rentData);

            Property.findByIdAndUpdate(foundProperty._id,foundProperty, function(){
                next();
            })

        }
    })

}


//Function used for updating a property value

function prop_val_update(propid, next) {

    var url = 'https://www.zoopla.co.uk/property/';

    Property.findById(propid).populate("Tenants").populate('properties').exec(function (err, foundProperty) {
        if (err) {
            console.log(err);
        } else {

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

            //console.log(foundProperty.estimatedValue.length)

            console.log(foundProperty);

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
                    //Check if the string has a 'k' in else it is a 'm'.
                    if (currentPrice.indexOf('k') > -1) {
                        currentPrice = currentPrice.split('k')[0];
                        currentPrice = currentPrice.replace(',', '');
                        currentPrice = currentPrice.replace(',', '');
                        currentPrice = currentPrice * 1E3;
                        console.log(currentPrice);

                    } else {

                        currentPrice = currentPrice.split('m')[0];
                        currentPrice = currentPrice.replace(',', '');
                        currentPrice = currentPrice.replace(',', '');
                        currentPrice = currentPrice * 1E6;
                        console.log(currentPrice);

                    }

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
                                next();
                            }
                        })
                    })

                })


        }
    })

}

//         Scheduler        (Second, minute, hour, day_of_month, month, day_of_week)   
//Call the schedule at 2:00 every Sunday                  
var j = schedule.scheduleJob({hour: 14, minute:0, dayOfWeek:0}, function () {
    //for all users, Calculate the prop_val_updat
    console.log("Completing update of values");
    User.find({}, function (err, users) {
        users.forEach(function (user) {

            //For all properties associated with the user calculate the prop value 
            //Then update the portfolio value 

            for (var i = 0; i < user.properties.length; i++) {

                prop_val_update(user.properties[i]._id, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {

                    }
                });
            }
            update_portfolio(user._id, function (err, data) {
                if (err) {
                    console.log(err);
                } else {

                }
            });
        })
    })
})



app.get("/user/:id/manage/:propid", function (req, res) {
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

app.put("/user/:id/manage/:propid", function (req, res) {

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
app.put("/user/:id/properties/:propid/job", function (req, res) {
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

//ROUTES FOR TENANTS

//NEW TENANT ROUTE

function createNewTenant(req, res, next) {

    var firstname = req.body.firstname;
    var lastname = req.body.lastname;
    var email = req.body.email;
    var mobile_number = req.body.mobile_number;
    var home_number = req.body.house_number;
    var animals = req.body.animals;
    var propid = req.params.id;


    var newTenant = {
        firstname: firstname,
        lastname: lastname,
        email: email,
        mobile_number: mobile_number,
        home_number: home_number,
        animals: animals,
        property: propid,
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


app.post("/properties/:id/new-tenant", createNewTenant, function (req, res) {
    res.render("home.ejs");
})

app.delete("/properties/:id/new-tenant/:tid", function (req, res) {
    Tenant.findByIdAndRemove(req.params.tid, function (err) {
        res.redirect("/properties");
    })

})

app.listen("3000");