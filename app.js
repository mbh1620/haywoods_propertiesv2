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
var middleware = require("./middleware")

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
    first:String

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

app.use(require("express-session")({
    secret: "Once again Rusty wins the cutest dog!",
    resave: false,
    saveUninitialized: false
}));


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
            if (!fs.existsSync(dest)){
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
            if (!fs.existsSync(dest)){
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

var upload_mult = multer({ storage: store_multiple});

var upload = multer({ storage: storage });
//=============================================================
app.set('views', './views');

app.use(express.static(__dirname + "/public"));
app.use('/uploads', express.static('uploads'));


mongoose.connect("mongodb://localhost/haywoodsproperties", { useNewUrlParser: true, useFindAndModify: false });
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

app.get("/properties/new", function (req, res) {
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
        }
    }

    Property.create(newProperty, function (err, _property) {
        if (err) {
            console.log(err);
        } else { }
        req.property = _property;
        var the_User = req.user;
        console.log(the_User.username);
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


app.post("/properties/new", createNewProperty, upload_mult.array('images',5), function (req, res) {
    Property.findByIdAndUpdate(req.property._id, req.body.property, function (err, updatedProperty) {
        if (err) {
            console.log("error has occurred");
            res.redirect("/properties");
        } else {
            fs.readdir("uploads/" + req.property._id, (err, files) => {
                if (err){
                    console.log(err);
                    res.redirect("/properties");
                }
                updatedProperty.first = files[0];
                updatedProperty.save(function(err, data){
                    if(err){
                        console.log(err)
                        res.redirect("/properties");
                    }else{
                        res.redirect("/properties");
                    }
                })
                
            } )
            
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
                    res.render("show.ejs", {property: foundProperty, images: images})
                }

                for (const file of files) {
                    images.push(file);
                }
                res.render("show.ejs", { property: foundProperty, images: images})
            } )
        }
    })
})

//EDIT ROUTE

app.get("/properties/:id/edit", function (req, res) {
    Property.findById(req.params.id, function (err, foundProperty) {
        res.render("edit.ejs", { property: foundProperty })
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
                } )
                
                
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
    res.render("settings.ejs")
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





app.listen("3000");