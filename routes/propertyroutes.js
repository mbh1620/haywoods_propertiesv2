// Routes for properties, Create, Edit, Delete etc..
var express = require('express');
var router = express.Router();
var middleware = require("../middleware");
var multer = require("multer");
var fs = require("fs");
var graphingroutes = require("./graphingroutes");
var prop_val_update = graphingroutes.prop_val_update;
var update_portfolio = graphingroutes.update_portfolio;
var update_rent_total_income = graphingroutes.update_rent_total_income;
var prop_rent_val_update = graphingroutes.prop_rent_val_update;

//============================================
//              Multer Setup
//============================================

/* Multer setup is required in this file to makesure files
upload correctly when creating a new property */

//MULTER SET UP
var storage = multer.diskStorage({
    destination: (request, file, callback) => {
        if (request.property) {
            var dest = "./uploads/" + request.property._id.toString();
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest);
            }
            return callback(null, dest);
        } else {
            return 0;
        }
    },

    filename: function (request, file, callback) {
        if (request.property) {
            return callback(null, request.property._id.toString());
        }
        else {
            return 0;
        }
    }
})

var store_multiple = multer.diskStorage({
    destination: (request, file, callback) => {
        if (request.property) {
            var dest = "./uploads/" + request.property._id.toString();
            if (!fs.existsSync(dest)) {
                fs.mkdirSync(dest);
            }
            return callback(null, dest);

        } else {
            return 0;
        }
    },

    filename: function (request, file, callback) {
        if (request.property) {
            return callback(null, request.property._id.toString() + Date.now());
        }
        else {
            return 0;
        }
    }
})

var upload_mult = multer({ storage: store_multiple });

var upload = multer({ storage: storage });


//============================================
//              Properties Routes
//============================================

var Property = require("../models/property");
var User = require("../models/user");

//INDEX ROUTE

router.get("/properties", function (req, res) {
    Property.find({}, function (err, allProperties) {
        if (err) {
            console.log(err);
        } else {
            res.render("properties.ejs", { properties: allProperties });
        }
    })
})

//NEW PROPERTIES FORM ROUTE

router.get("/properties/new", middleware.isLoggedIn, function (req, res) {
    res.render("new_properties.ejs");
})

//CREATE ROUTE
function createNewProperty(req, res, next) {
    var name = req.body.name;
    var price = req.body.price;
    var description = req.body.description;
    var lat = req.body.lat;
    var long = req.body.long;
    var currentUser = req.user;




    console.log(name);

    var newProperty = {
        name: name,
        price: price,
        description: description,
        lat: lat,
        long: long,
        author: {
            id: currentUser,
            username: currentUser.username
        },
    }

    Property.create(newProperty, function (err, _property) {
        if (err) {
            console.log(err);
        } else { }
        req.property = _property;
        var the_User = req.user;
        the_User.properties.push(_property);


        // 
        the_User.save(function (err, data) {
            if (err) {
                console.log(err)
            } else {
                next();
            }
        })
    });
}


router.post("/properties/new", createNewProperty, upload_mult.array('images', 5), function (req, res) {
    Property.findByIdAndUpdate(req.property._id, req.body.property, function (err, updatedProperty) {
        if (err) {
            console.log("error has occurred");
            res.redirect("/properties");
        } else {
            fs.readdir("uploads/" + req.property._id, (err, files) => {
                if (err) {
                    console.log(err);
                    res.redirect("/properties");
                }
                console.log(files);
                if (files !== undefined) {
                    updatedProperty.first = files[0];
                    updatedProperty.save(function (err, data) {
                        if (err) {
                            console.log(err)
                            res.redirect("/properties");
                        } else {
                            //Add in empty property values from january until the current month
                            
                            //first get current month 

                            var d = new Date();
                            var curr_month = d.getMonth();

                            //now add a loop for the 

                            for(var i = 0; i < curr_month; i++){


                                //Clean up later however year and month not needed.

                                var estimatedValue = {
                                    year: null,
                                    month: null,
                                    value: null
                                }

                                var rentData = {
                                    year: null, 
                                    month: null, 
                                    price: null
                                }

                                updatedProperty.estimatedValue.push(estimatedValue);
                                updatedProperty.rentData.push(rentData);

                            }

                            Property.findByIdAndUpdate(updatedProperty._id, updatedProperty, function(err, data){
                                if(err){
                                    console.log(err);
                                }else{
                                    prop_val_update(updatedProperty._id, function (err, data) {
                                        
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            prop_rent_val_update(updatedProperty._id, function (err, data){
                                                if(err) {
                                                    console.log(err);
                                                } else {
                                                    res.redirect("/properties");
                                                }
                                            })
                                            
                                        }
                                    })
                                }
                            })
                        }
                    })
                }


            })

        }
    })
});
//SHOW ROUTE

router.get("/properties/:id", function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        var images = []
        if (err) {
            console.log("this error");
            console.log(err);
        } else {
            fs.readdir("uploads/" + req.params.id, (err, files) => {
                if (err) {
                    console.log(err);
                    res.render("show.ejs", { property: foundProperty, images: images })
                }
                if (files !== undefined) {
                    for (const file of files) {
                        images.push(file);
                    }
                }

                res.render("show.ejs", { property: foundProperty, images: images })
            })
        }
    })
})

//EDIT ROUTE

router.get("/properties/:id/edit", function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        res.render("edit.ejs", { property: foundProperty })
    })
})

//MANAGE ROUTE

router.get("/properties/:id/manage", function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        res.render("manage.ejs", { property: foundProperty })
    })
})

//UPDATE ROUTE

router.put("/properties/:id", function (req, res) {
    Property.findByIdAndUpdate(req.params.id, req.body.property, function (err, updatedProperty) {
        if (err) {
            console.log("error has occurred");
        } else {
            console.log(req.body.property);
            res.redirect("/properties");
        }
    })
})

//DESTROY ROUTE

router.delete("/properties/:id", function (req, res) {
    Property.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            console.log(err)
        } else {
            // Check to see if the file exists before deleting it
            if (fs.existsSync("uploads/" + req.params.id)) {
                fs.readdir("uploads/" + req.params.id, (err, files) => {
                    if (err) throw err;

                    for (const file of files) {
                        fs.unlinkSync("uploads/" + req.params.id + "/" + file)
                    }
                    fs.rmdirSync("uploads/" + req.params.id);
                })


            }
            res.redirect("/properties");

        }
    })
});

module.exports = router;
