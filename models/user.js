var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose")

//--------------------------------------------------
//
//                  User Schema
//
//--------------------------------------------------

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
    ],
    PortfolioValue: [{
        year: String,
        month: String,
        value: Number
    }],
    totalRentIncomeData: [{
        year: String, 
        month: String, 
        value: Number
    }]
})

UserSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", UserSchema);

