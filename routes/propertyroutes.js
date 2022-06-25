// Routes for properties, Create, Edit, Delete etc..
var express = require('express');
var router = express.Router();
var middleware = require("../middleware");
var multer = require("multer");
var fs = require("fs");
var sharp = require('sharp');
var graphingroutes = require("./graphingroutes");
var Enquiry = require("../models/enquiry");
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
                fs.mkdirSync(dest + "/thumbnails");
            }
            return callback(null, dest);

        } else {
            console.log("there is an error!");
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
var Enquiry = require("../models/enquiry");
const property = require('../models/property');

//INDEX ROUTE

router.get("/properties", function (req, res) {
    var page = "Properties for Let in Leicester";
    Property.find({}, function (err, allProperties) {
        if (err) {
            console.log(err);
        } else {
            res.render("properties.ejs", { properties: allProperties, page: page });
        }
    })
})

//NEW PROPERTIES FORM ROUTE

router.get("/properties/new", middleware.isLoggedIn, function (req, res) {
    var page = "Create a new Property"
    res.render("new_properties.ejs", { page: page });
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
            id: currentUser._id,
            username: currentUser.username
        }
    }

    Property.create(newProperty, function (err, _property) {
        if (err) {
            console.log(err);
        } else { }
        req.property = _property;
        var the_User = req.user;
        the_User.properties.push(_property);

        fs.mkdirSync("./uploads/" + req.property._id.toString())

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
            console.log(err);
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

                            for (var i = 0; i < curr_month; i++) {


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

                            Property.findByIdAndUpdate(updatedProperty._id, updatedProperty, function (err, data) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    prop_val_update(updatedProperty._id, function (err, data) {

                                        if (err) {
                                            console.log(err);
                                        } else {
                                            prop_rent_val_update(updatedProperty._id, function (err, data) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    if (fs.existsSync("uploads/" + req.property._id + "/") && files.length > 0) {
                                                        sharp("uploads/" + req.property._id + "/" + files[0]).resize({ width: 650 }).toFile("uploads/" + req.property._id + "/thumbnails/resized_for_share.png")
                                                            .then(() => {
                                                                res.redirect("/properties");
                                                            })
                                                    } else {
                                                        res.redirect('/properties')
                                                    }
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

router.get("/properties/:id", middleware.isLoggedIn, function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        var images = []
        if (err) {
            console.log(err);
        } else {
            fs.readdir("uploads/" + req.params.id, (err, files) => {
                if (err) {
                    console.log(err);
                    res.render("show.ejs", { property: foundProperty, images: images })
                }
                if (files != undefined) {
                    for (const file of files) {
                        if (files !== undefined && !fs.lstatSync("./uploads/" + req.params.id + "/" + file).isDirectory()) {
                            images.push(file);
                        }
                    }
                }
                res.render("show.ejs", { property: foundProperty, images: images })
            })
        }
    })
})

//CREATE ENQUIRY ROUTE

router.get("/properties/:id/enquire", middleware.isLoggedIn, function (req, res) {
    res.render("enquire.ejs", { propertyId: req.params.id });
})

router.post("/properties/:id/enquire/send", middleware.isLoggedIn, function (req, res) {

    //Create a new enquiry and attach to the property
    //Will also need to add some security such as limit one enquiry per user and sanitization
    var title = req.body.title;
    var Message = req.body.body;
    var number_Occupants = 0;
    var pets = false;
    var date = Date.now();

    User.findById(req.user._id, function (err, foundUser) {
        if (err) {
            console.log(err);
        } else {
            var enquiry = {
                User: foundUser,
                Title: title,
                Message: Message,
                number_Occupants: number_Occupants,
                pets: pets,
                messageTitle: title,
                date: date,
                Property: {
                    id: req.params.id
                }
            }
            Enquiry.create(enquiry, function (err, newEnquiry) {
                if (err) {
                    console.log(err);
                } else {
                    Property.findById(req.params.id, function (err, updatedProperty) {
                        if (err) {
                            console.log("error has occurred");
                        } else {
                            updatedProperty.Enquiries.push(newEnquiry)
                            updatedProperty.save();
                            res.redirect("/properties");
                        }
                    })
                }
            })
        }
    })
})

router.get("/properties/:id/enquiry/:enquiryId/view", middleware.isLoggedIn, function (req, res) {
    Enquiry.findById(req.params.enquiryId, function (err, foundEnquiry) {
        if (err) {
            console.log(err)
        } else {
            Property.findById(req.params.id, function (err, foundProperty) {
                if (err) {
                    console.log(err)
                } else {
                    res.render("viewEnquiry.ejs", { enquiry: foundEnquiry, property: foundProperty });
                }
            })
        }
    })
})

//PROPERTY RENEWAL REMINDER ROUTES
//Reminder routes are all AJAX calls
router.post("/properties/:id/gasReminder", function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        if (err) {
            console.log("error has occurred");
        } else {
            foundProperty.gasSafetyRenewal = req.body.gasDate
            foundProperty.gasSafetyStatus = calculateStatus(req.body.gasDate)
            foundProperty.save();
            res.sendStatus(200);
        }
    })
})

router.post("/properties/:id/gasCompletion", function(req,res){
    Property.findById(req.params.id, function (err, foundProperty) {
        if (err) {
            console.log("error has occurred");
        } else {
            foundProperty.gasSafetyCompletion = req.body.gasCompletion
            foundProperty.save();
            res.sendStatus(200);
        }
    })
})

router.post("/properties/:id/electricalReminder", function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        if (err) {
            console.log("error has occurred");
        } else {
            foundProperty.electricalSafetyRenewal = req.body.electricalDate
            foundProperty.electricalSafetyStatus = calculateStatus(req.body.electricalDate)
            foundProperty.save();
            res.sendStatus(200);
        }
    })

})

router.post("/properties/:id/electricalCompletion", function(req,res){
    Property.findById(req.params.id, function (err, foundProperty) {
        if (err) {
            console.log("error has occurred");
        } else {
            foundProperty.electricalSafetyCompletion = req.body.electricalCompletion
            foundProperty.save();
            res.sendStatus(200);
        }
    })
})

router.post("/properties/:id/insuranceReminder", function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        if (err) {
            console.log("error has occurred");
        } else {
            foundProperty.propertyInsuranceRenewal = req.body.insuranceDate
            foundProperty.propertyInsuranceStatus = calculateStatus(req.body.insuranceDate)
            foundProperty.save();
            res.sendStatus(200);
        }
    })
})

router.post("/properties/:id/insuranceCompletion", function(req,res){
    Property.findById(req.params.id, function (err, foundProperty) {
        if (err) {
            console.log("error has occurred");
        } else {
            foundProperty.propertyInsuranceCompletion = req.body.insuranceCompletion
            foundProperty.save();
            res.sendStatus(200);
        }
    })
})

router.post("/properties/:id/addExpense", function(req,res){
    var userId = req.body.user
    Property.findById(req.params.id, function(err, foundProperty){
        if(err) {
            console.log(err)
        } else {
            foundProperty.propertyExpenses.push({
                Name: req.body.expenseName,
                Detail: req.body.expenseDetail,
                Type: req.body.expenseType,
                Date: new Date(),
                Amount: req.body.expenseAmount
            })
            foundProperty.save()
            res.redirect("/user/"+userId+"/manage/"+req.params.id);
        }
    })
})

//EDIT ROUTE - ADD MIDDLEWARE! and author checking (DONE) 
router.get("/properties/:id/edit", middleware.isLoggedIn, function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        var images = []
        if (req.user.id == foundProperty.author.id) {
            fs.readdir("uploads/" + req.params.id, (err, files) => {
                if (err) {
                    console.log(err);
                    res.render("edit.ejs", { property: foundProperty, images: images })
                }
                for (const file of files) {
                    if (files !== undefined && !fs.lstatSync("./uploads/" + req.params.id + "/" + file).isDirectory()) {
                        images.push(file);
                    }
                }
                res.render("edit.ejs", { property: foundProperty, images: images })
            })
        } else {
            res.redirect("/error");
        }
    })
})

//UPDATE ROUTE - MIDDLEWARE DONE
router.put("/properties/:id", middleware.isLoggedIn, function (req, res) {
    //Need to add if certain photos need to be deleted or added and reordered
    Property.findById(req.params.id, function (err, foundProperty) {
        if (err) {
            console.log(err);
        } else {
            if (foundProperty.author.id == req.user.id) {
                Property.findByIdAndUpdate(req.params.id, req.body.property, function (err, updatedProperty) {
                    if (err) {
                        console.log("error has occurred");
                        console.log(err);
                    } else {
                        console.log(req.body.property);
                        console.log(req.body);
                        //console.log(updatedProperty);
                        res.redirect("/properties");
                    }
                })
            } else {
                res.redirect("/properties");
            }
        }
    })


})

//MANAGE ROUTE - ADD MIDDLEWARE and author checking (DONE)

router.get("/properties/:id/manage", middleware.isLoggedIn, function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        if (req.user.id == foundProperty.author.id) {
            res.render("manage.ejs", { property: foundProperty })
        } else {
            res.redirect("/error");
        }
    })
})

//DESTROY ROUTE - MIDDLEWARE DONE

router.delete("/properties/:id", middleware.isLoggedIn, function (req, res) {
    //if user id is equal to property owner id then delete
    Property.findById(req.params.id).exec(function (err, _property) {
        if (err) {
            console.log(err);
        } else {
            //If author id is equal to currentUserid then proceed with deletion
            if (_property.author.id == req.user.id) {
                Property.findByIdAndRemove(req.params.id, function (err) {
                    if (err) {
                        console.log(err)
                    } else {
                        // Check to see if the file exists before deleting it
                        if (fs.existsSync("uploads/" + req.params.id)) {
                            fs.readdir("uploads/" + req.params.id, (err, files) => {
                                if (err) throw err;

                                for (const file of files) {
                                    if (fs.lstatSync("uploads/" + req.params.id + "/" + file).isDirectory()) {
                                        fs.rmdirSync("uploads/" + req.params.id + "/" + file, { recursive: true });
                                    } else {
                                        fs.unlinkSync("uploads/" + req.params.id + "/" + file);
                                    }
                                }
                                fs.rmdirSync("uploads/" + req.params.id);
                            })
                        }
                        res.redirect("/properties");
                    }
                })
            } else {
                res.redirect("/properties");
            }
        }
    })
});

//AJAX PHOTO ROUTES - ADD, DELETE, REORDER

function findProp(req, res, next) {
    Property.findById(req.params.id, function (err, found) {
        req.property = found;
        next();
    })
}

//Add Photo AJAX route
router.post("/properties/:id/photo", middleware.isLoggedIn, findProp, upload_mult.array('file', 5), function (req, res) {
    //If the photos have been successful then re-scan the directory and then send the images back so that the page updates showing newly uploaded photos.
    //scan the properties files and send them back so that new thumbnails can be added
    //Send the url of the newly uploaded photo for the thumbnail to display
    //we need to scan the property directory
    fs.readdir("uploads/" + req.params.id, (err, files) => {
        if (err) {
            console.log(err);
        }
        var images = [];
        for (const file of files) {
            if (files !== undefined && !fs.lstatSync("./uploads/" + req.params.id + "/" + file).isDirectory()) {
                images.push(file);
            }
        }
        res.send({ images: images });
        res.end('{"success" : "Updated Successfully", "status" : 200}');
        console.log("uploaded");
    })
});

//Delete photo route
router.delete("/properties/:id/photo/:photoId", middleware.isLoggedIn, function (req, res) {
    // Use the photo id to delete the photo
    fs.unlinkSync("uploads/" + req.params.id + "/" + req.params.photoId);
    // Then if photo has been deleted successfully send back a success response to the ajax
    res.end('{"success" : "Updated Successfully", "status" : 200}');
});

//Reorder photos
// router.put("/properties/:id/photo/reorder", middleware.isLoggedIn, function(req,res){

// })

function calculateStatus(renewalDateInput) {
    var renewalDate = new Date(renewalDateInput)
    var todaysDate = new Date()

    var status;

    var difference_in_millis = renewalDate.getTime() - todaysDate.getTime();
    var difference_in_days = Math.ceil(difference_in_millis / (1000 * 3600 * 24));

    if (difference_in_days <= 30 && difference_in_days > 0) {
        //Change Status to "Due for renewal"
        status = "Due for Renewal"
    } else if (difference_in_days <= 0) {
        //Change Status to "Past Deadline! needs renewing now!"
        status = "Past Deadline! Needs Renewing Now!"
    } else {
        //Change Status to "Completed"
        status = "Completed"
    }
    //Work out status
    return status
}

module.exports = router;
