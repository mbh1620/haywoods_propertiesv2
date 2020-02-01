var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var fs = require("fs");
var methodOverride = require("method-override");
var multer = require("multer");
var LocalStrategy = require("passport-local");
var passport = require("passport");
var passportLocalMongoose = require("passport-local-mongoose");
var middleware = require("./middleware");
var axios = require('axios');
var cheerio = require('cheerio');
var SessionStore = require('session-mongoose')

//TENANT SCHEMA
var TenantSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    email: String,
    mobile_number: String,
    home_number: String,
    animals: Number,
    property: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property"
    },
    CurrentTenant: Boolean,
    date_moved_in: String,
    date_moved_out: String
})

var Tenant = mongoose.model("Tenant", TenantSchema)



//PROPERTY SCHEMA
var propertySchema = new mongoose.Schema({
    name: String,
    price: String,
    description: String,
    lat: Number,
    long: Number,
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    first: String,
    estimatedValue: [{
        year: String,
        month: String,
        price: Number
    }],
    zoopla_id: Number,
    maintenance_item: [{
        Name: String,
        Detail: String,
        Finish_Date: String,
        Done: Boolean
    }],
    Tenants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tenant"
    }]

});

var Property = mongoose.model("Property", propertySchema);

app.use(methodOverride("_method"));


//USER SCHEMA
var UserSchema = new mongoose.Schema({
    firstname: String,
    lastname: String,
    username: String,
    email: String,
    properties: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Property"
        }
    ]
})

UserSchema.plugin(passportLocalMongoose);
var User = mongoose.model("User", UserSchema);

// app.use(require("express-session")({
//     secret: "Once again Rusty wins the cutest dog!",
//     resave: false,
//     saveUninitialized: false
// }));

app.use(
  express.session({
    store: new SessionStore({
    url: process.env.MONGODB_URI,
    interval: 1200000
  }),
  cookie: { maxAge: 1200000 },
  secret: 'my secret'
}))





//PASSPORT SETUP
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    next();
});


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
//=============================================================
app.set('views', './views');


app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname + "/public"));


mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useFindAndModify: false });
app.use(bodyParser.urlencoded({ extended: true }));


//===============================
//      Properties Routes
//===============================


app.get("/", function (req, res) {
    res.render("home.ejs");
})

//INDEX ROUTE

app.get("/properties", function (req, res) {
    Property.find({}, function (err, allProperties) {
        if (err) {
            console.log(err);
        } else {
            res.render("properties.ejs", { properties: allProperties });
        }
    })
})

//NEW PROPERTIES FORM ROUTE

app.get("/properties/new", middleware.isLoggedIn, function (req, res) {
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


app.post("/properties/new", createNewProperty, upload_mult.array('images', 5), function (req, res) {
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
                            res.redirect("/properties");
                        }
                    })
                }


            })

        }
    })
});
//SHOW ROUTE

app.get("/properties/:id", function (req, res) {
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

app.get("/properties/:id/edit", function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        res.render("edit.ejs", { property: foundProperty })
    })
})

//MANAGE ROUTE

app.get("/properties/:id/manage", function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        res.render("manage.ejs", { property: foundProperty })
    })
})

//UPDATE ROUTE

app.put("/properties/:id", function (req, res) {
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

app.delete("/properties/:id", function (req, res) {
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

//USERS SIGNUP/Login/Logout ROUTES

app.get("/register", function (req, res) {
    res.render("register.ejs");
});

app.post("/register", function (req, res) {
    User.register(new User({ username: req.body.username, firstname: req.body.firstname, lastname: req.body.lastname, email: req.body.email }), req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            return res.render("register.ejs");
        }


        passport.authenticate("local")(req, res, function () {
            res.redirect("/");
        })
    })
})

app.get("/login", function (req, res) {
    res.render("login.ejs");
})

app.post("/login", passport.authenticate("local",
    {
        successRedirect: "/properties",

        failureRedirect: "/login"

    }), function (req, res) {

    });

app.post("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
})

//Account Settings routes

app.get("/user/:id", function (req, res) {
    var userid = req.params.id
    User.findById(req.params.id, function (err, founduser) {
        if (err) {
            console.log(err);
        } else {
            res.render("settings.ejs", { user: founduser })
        }
    })

})

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

app.get("/user/:id/manage", function (req, res) {
    var userid = req.params.id
    //Add populate function HERE!!!!
    User.findById(req.params.id).populate('properties').exec(function (err, founduser) {
        if (err) {
            console.log(err);
        } else {
            res.render("manage.ejs", { property: founduser.properties });
        }
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
                            currentPrice = currentPrice.replace(',', '');
                            currentPrice = currentPrice.replace(',', '');
                            currentPrice = currentPrice.split('£');
                            currentRent = currentPrice[2];
                            currentPrice = currentPrice[1];
                            console.log(currentPrice);
                            
                            function pushNewprop(callback){
                                foundProperty.estimatedValue.push({
                                    year: theyear,
                                    month: themonth,
                                    price: currentPrice
                                })
                                callback(); 
                            }

                            pushNewprop(function(err){
                                Property.findByIdAndUpdate(propid, foundProperty, {new: true}, function (err, updatedProperty) {
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
app.put("/user/:id/properties/:propid/job", function (req,res) {
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
            Property.findByIdAndUpdate(req.params.propid, updatedProperty, function(err, updatedProperty) {
                if(err) {
                    console.log(err);
                }else{
                    res.redirect("/user/" + id + "/manage/" + updatedProperty.id);
                }
            })
            
        }
    })
})

//ROUTES FOR TENANTS

//NEW TENANT ROUTE

function createNewTenant(req,res,next){

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
        Property.findById(propid, function(err, foundProperty){
            foundProperty.Tenants.push(_tenant);
            foundProperty.save(function (err,data){
                if(err) {
                    console.log(err);
                } else {
                    next();
                }
            })
        })
    });

    
}


app.post("/properties/:id/new-tenant", createNewTenant, function(req,res){
    res.render("home.ejs");
})

app.delete("/properties/:id/new-tenant/:tid", function(req,res){
    Tenant.findByIdAndRemove(req.params.tid, function(err){
        res.redirect("/properties");
    })
    
})





app.listen("3000");