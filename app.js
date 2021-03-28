//=====================================================
//
//              Haywood's Properties app.js
//                
//=====================================================

//author: Matthew Haywood

// Module Imports
var dotenv = require("dotenv").config();
var express = require("express");
var app = express();
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var methodOverride = require("method-override");

// Route Imports 
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

if(process.env.NODE_ENV === 'production'){
    //Connect to Production Database
    mongoose.connect("mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@cluster0.drwm0.mongodb.net/Haywoods_properties?retryWrites=true&w=majority", { useUnifiedTopology:true, useNewUrlParser: true, useFindAndModify: false });
} else if (process.env.NODE_ENV === 'development'){
    //Connect to Development Database
    mongoose.connect("mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@cluster0.drwm0.mongodb.net/Haywoods_properties_development?retryWrites=true&w=majority", { useUnifiedTopology:true, useNewUrlParser: true, useFindAndModify: false });
} 

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

// 404 - Error Route
app.get("/*", function (req, res){
    res.render("error.ejs");
})

app.listen("8080");
