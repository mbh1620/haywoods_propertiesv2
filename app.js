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

//=====================================================
//                 Database connection
//=====================================================

mongoose.connect("mongodb://matthew:matthew12@ds129796.mlab.com:29796/heroku_cx76x142", { useNewUrlParser: true, useFindAndModify: false });
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
