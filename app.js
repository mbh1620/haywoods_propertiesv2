var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");

// ROUTE IMPORTS 
var propertyroutes = require('./routes/propertyroutes');
var tenantroutes = require('./routes/tenantroutes');
var usersroutes = require('./routes/usersroutes');
var graphingroutes = require('./routes/graphingroutes').router;
var scheduler_monthly = require('./routes/graphingroutes').j;

//app config
app.use(methodOverride("_method"));

app.use(require("express-session")({
    secret: "Once again Rusty wins the cutest dog!",
    resave: false,
    saveUninitialized: false
}));

//=====================================================
app.set('views', './views');

app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname + "/public"));
app.use('/scripts', express.static(__dirname + "/views/manageproperties"));

//====================================================
//                 Database connection
//====================================================

mongoose.connect("mongodb+srv://matthew01:haywood@cluster0.drwm0.mongodb.net/Haywoods_properties?retryWrites=true&w=majority", { useNewUrlParser: true, useFindAndModify: false });
app.use(bodyParser.urlencoded({ extended: true }));


//=====================================================
//
//                   Main App Routes 
//
//=====================================================

app.use("/",usersroutes);
app.use("/",propertyroutes);
app.use("/",graphingroutes);
app.use("/",tenantroutes);

// Index route
app.get("/", function (req, res) {
    res.render("home.ejs");
});

app.listen("8080");
