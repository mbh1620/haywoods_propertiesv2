var mongoose = require("mongoose");

//--------------------------------------------------
//
//                  Tenant Schema
//
//--------------------------------------------------


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

module.exports = mongoose.model("Tenant", TenantSchema);