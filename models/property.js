var mongoose = require("mongoose");

//--------------------------------------------------
//
//              Property Schema
//
//--------------------------------------------------

var propertySchema = new mongoose.Schema({
    name: String,
    price: Number,
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
    rentData: [{
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
    }],
    show_on_main: Boolean,
    Enquiries: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Enquiry"
    }],
    gasSafetyRenewal: String,
    gasSafetyCompleted: Boolean,
    gasSafetyCompletedDate: String,
    gasSafetyStatus: String,
    
    electricalSafetyRenewal: String,
    electricalSafetyCompleted: Boolean,
    electricalSafetyCompletedDate: String,
    electricalSafetyStatus: String,

    propertyInsuranceRenewal: String,
    propertyInsuranceCompleted: Boolean,
    propertyInsuranceCompletedDate: String,
    propertyInsuranceStatus: String
});

module.exports = mongoose.model("Property", propertySchema);