var mongoose = require("mongoose");

//--------------------------------------------------
//
//              Enquiry Schema
//
//--------------------------------------------------

//This is for potential tenants

var enquirySchema = new mongoose.Schema({
    User: {
        id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    username: String
    },
    date: Date,
    Property: {
        id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Property"
    },
},
    number_Occupants: Number, 
    pets: Boolean, 
    Message: String,
    Title: String
})

module.exports = mongoose.model("Enquiry", enquirySchema);