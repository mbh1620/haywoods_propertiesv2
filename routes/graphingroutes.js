// The routes used for updating the values used for graphing the zoopla values for total portfolio.
var express = require('express');
var router = express.Router();
var axios = require('axios');
var cheerio = require('cheerio');
var schedule = require('node-schedule');
var User = require("../models/user");
var Property = require("../models/property");
var excel = require("exceljs");


//================================================
//           Rent Graph Routes and Functions
//================================================

//Function for updating total rent income
function update_rent_total_income(user_id, pop_flag, next) {
    User.findByIdAndUpdate(user_id).populate('properties').exec(function (err, founduser) {
        if (err) {
            console.log(err);
        } else {
            //Total all the current months rent income from each house and then sum it and push to total rent data.
            var total_rent_income = 0;
            var CurrentYear;
            var CurrentMonth;

            console.log(founduser);

            var d = new Date();

            CurrentYear = d.getFullYear();
            CurrentMonth = d.getMonth();

            var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            for (var i = 0; i < founduser.properties.length; i++) {
                if (!isNaN(founduser.properties[i].price))
                    total_rent_income = total_rent_income + founduser.properties[i].price;
            }

            /* 
            totalRentIncomeData: [{
                year: String, 
                month: String, 
                value: Number
            }]
            */

            var totalRentIncomeData = {
                year: CurrentYear,
                month: months[CurrentMonth],
                value: total_rent_income
            }

            if (pop_flag == true && founduser.totalRentIncomeData[founduser.totalRentIncomeData.length-1].month == CurrentMonth) {
                founduser.totalRentIncomeData.pop();
            }

            founduser.totalRentIncomeData.push(totalRentIncomeData);

            User.findByIdAndUpdate(founduser._id, founduser, function (err, updatedUser) {
                if (err) {
                    console.log(err);
                } else {
                    next();
                }
            })
        }
    })
}

//Route for recalculating Rent Value 
router.post("/calculate_rent", function (req, res) {
    update_rent_total_income(req.body.id, true, function () {
        res.redirect("/user/" + req.body.id + "/manage");
    })
})

//Function used for updating property rent value data 
function prop_rent_val_update(propid, next) {

    //first find prop by id

    Property.findById(propid, function (err, foundProperty) {
        if (err) {
            console.log();
        } else {
            var d = new Date();
            var month = d.getMonth();
            var year = d.getFullYear();


            //Get current property rent value

            var rent = foundProperty.price;

            /* var rentData: [{
                year: String, 
                month: String,
                price: Number
            }], */

            var rentData = {
                year: year,
                month: month,
                price: rent
            }

            foundProperty.rentData.push(rentData);

            Property.findByIdAndUpdate(foundProperty._id, foundProperty, function () {
                next();
            })

        }
    })

}

//================================================
//     Portfolio Value Graph Routes and Functions
//================================================

//Function for updating PortFolio Value. pop_flag is set to true if the last item is to be replaced by the new one.
function update_portfolio(user_id, pop_flag, next) {
    User.findById(user_id).populate('properties').exec(function (err, founduser) {
        if (err) {
            console.log(err)
        } else {
            var portfolio_total = 0;
            var the_date = new Date();
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
            var CurrentYear = the_date.getFullYear();
            var CurrentMonth = month[the_date.getMonth()];

            //Code for updating the users Portfolio value, rent etc...
            for (var i = 0; i < founduser.properties.length; i++) {
                if (typeof founduser.properties[i].estimatedValue !== 'undefined') {
                    if (typeof founduser.properties[i].estimatedValue[founduser.properties[i].estimatedValue.length - 1].price !== 'undefined') {
                        portfolio_total = portfolio_total + founduser.properties[i].estimatedValue[founduser.properties[i].estimatedValue.length - 1].price;
                        console.log(portfolio_total);
                    }
                } else {
                    console.log("estimated value for this property is undefined");
                }
            }

            var CurrentPortFolioValue = {
                year: CurrentYear,
                month: CurrentMonth,
                value: portfolio_total
            }
            console.log(CurrentMonth);

            if (pop_flag == true && founduser.PortfolioValue[founduser.PortfolioValue.length-1].month == CurrentMonth) {
                founduser.PortfolioValue.pop();
            }

            founduser.PortfolioValue.push(CurrentPortFolioValue);

            console.log(founduser)


            User.findByIdAndUpdate(founduser._id, founduser, function (err, updatedUser) {
                if (err) {
                    console.log(err)
                } else {
                    next();
                }
            });
        }
    })
}

//Route for recalculating PortFolio Value
router.post("/recalculate", function (req, res) {
    console.log(req.body.id)

    //Need to search for current month and year and then delete.

    update_portfolio(req.body.id, true, function () {
        res.redirect("/user/" + req.body.id + "/manage");
    })
})

//Function used for updating a property value
function prop_val_update(propid, next) {

    var url = 'https://www.zoopla.co.uk/property/';

    Property.findById(propid).populate("Tenants").populate('properties').exec(function (err, foundProperty) {
        if (err) {
            console.log(err);
        } else {

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
            console.log(themonth)
            console.log(foundProperty)
            var theyear = d.getFullYear();

            //console.log(foundProperty.estimatedValue.length)

            console.log(foundProperty);

            url = url + foundProperty.zoopla_id;
            console.log(url);
            axios(url)
                .then(response => {
                    const html = response.data;
                    const $ = cheerio.load(html);
                    const estimatedPrice = $('.css-1tz04i5-Text-StyledEstimatedPriceText');
                    console.log("Scraped from Zoopla")
                    currentPrice = estimatedPrice.text();
                    console.log(currentPrice);

                    //If the property does not have a m in the string then do the following



                    //If the property is valued at 1m or above
                    currentPrice = currentPrice.substr(currentPrice.indexOf('£') + 1, currentPrice.indexOf('m'));
                    //Check if the string has a 'k' in else it is a 'm'.
                    if (currentPrice.indexOf('k') > -1) {
                        currentPrice = currentPrice.split('k')[0];
                        currentPrice = currentPrice.replace(',', '');
                        currentPrice = currentPrice.replace(',', '');
                        currentPrice = currentPrice * 1E3;
                        console.log(currentPrice);

                    } else {

                        currentPrice = currentPrice.split('m')[0];
                        currentPrice = currentPrice.replace(',', '');
                        currentPrice = currentPrice.replace(',', '');
                        currentPrice = currentPrice * 1E6;
                        console.log(currentPrice);

                    }

                    console.log(currentPrice);

                    function pushNewprop(callback) {
                        foundProperty.estimatedValue.push({
                            year: theyear,
                            month: themonth,
                            price: currentPrice
                        })
                        callback();
                    }

                    pushNewprop(function (err) {
                        Property.findByIdAndUpdate(propid, foundProperty, { new: true }, function (err, updatedProperty) {
                            if (err) {
                                console.log(err)
                            } else {
                                console.log("PROPERTY UPDATED!!!!")
                                console.log(updatedProperty)
                                next();
                            }
                        })
                    })

                })


        }
    })

}

//===========================================================
//     Schedule Function for triggering monthly calculations
//===========================================================

//         Scheduler        (Second, minute, hour, day_of_month, month, day_of_week)   
//Call the schedule at 2:00 every first day of the month                  
var j = schedule.scheduleJob({ hour: 14, minute: 0, dayOfMonth: 0 }, function () {
    //for all users, Calculate the prop_val_updat
    console.log("Completing update of values");
    User.find({}, function (err, users) {
        users.forEach(function (user) {

            //For all properties associated with the user calculate the prop value 
            //Then update the portfolio value 

            for (var i = 0; i < user.properties.length; i++) {

                prop_val_update(user.properties[i]._id, function (err, data) {
                    if (err) {
                        console.log(err);
                    } else {

                    }
                });
            }
            update_portfolio(user._id, false, function (err, data) {
                if (err) {
                    console.log(err);
                } else {

                }
            });
        })
    })
})

//===========================================================
//             Routes for creating XLSX sheets
//===========================================================

router.post('/user/:id/create_spreadsheet', function (req, res) {
    //Create a full spreadsheet for all users properties value and rent
    var year = req.body.year;
    var workbook = new excel.Workbook();
    var worksheet = workbook.addWorksheet('Year Total ' + year );

    worksheet.columns = [
        { header: 'Property Name', key: 'property_name' },
        { header: 'January', key: 'January' },
        { header: 'February', key: 'February' },
        { header: 'March', key: 'March' },
        { header: 'April', key: 'April' },
        { header: 'May', key: 'May' },
        { header: 'June', key: 'June' },
        { header: 'July', key: 'July' },
        { header: 'August', key: 'August' },
        { header: 'September', key: 'September' },
        { header: 'October', key: 'October' },
        { header: 'November', key: 'November' },
        { header: 'December', key: 'December' },
        { header: 'Rent Total', key: 'Rent Total' },
        { header: 'Expenses Total', key: 'Expenses Total' },
    ]

    worksheet.columns.forEach(column => {
        column.width = column.header.length < 12 ? 12 : column.header.length
      })

    //Force columns to be as long as header rows

    //Make the header bold
    worksheet.getRow(1).font = { bold: true }

    //get user and then get total rent and total expenses
    //Only get data for the current year from jan to dec
    var months = {
        'January': 0,
        'February': 1,
        'March': 2,
        'April': 3,
        'May': 4,
        'June': 5,
        'July': 6,
        'August': 7,
        'September': 8,
        'October': 9,
        'November': 10,
        'December': 11
    }

    var date = new Date();
    var currentYear = date.getFullYear();
    User.findById(req.params.id, function (err, foundUser) {
        rows = {}
        for (var z = 0; z < 12; z++) {
            for (var i = 0; i < foundUser.totalRentIncomeData.length; i++) {

                console.log(months[foundUser.totalRentIncomeData[i].month]);
                //Makesure that foundUser.totalRentIncomeData[i].year == currentYear and that .month is the next month in order
                if (months[foundUser.totalRentIncomeData[i].month] == z && foundUser.totalRentIncomeData[i].year == currentYear) {
                    //Add a row to the worksheet
                    rows[foundUser.totalRentIncomeData[i].month] = foundUser.totalRentIncomeData[i].value;
                }
            }

        }
        
        async function writeFile(){
            worksheet.addRow(rows);
            await workbook.xlsx.writeFile(foundUser.username + '_' + currentYear + '_RentData.xlsx');
            console.log("File is Written");
        }
        writeFile();
    })
});



module.exports.router = router;
module.exports.prop_val_update = prop_val_update;
module.exports.update_portfolio = update_portfolio;
module.exports.update_rent_total_income = update_rent_total_income;
module.exports.prop_rent_val_update = prop_rent_val_update;
module.exports.j = j;
