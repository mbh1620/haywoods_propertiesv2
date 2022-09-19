const PDFDocument = require('pdfkit');
const fs = require('fs');
const tenant = require('../models/tenant');

function createNewContract(tenantInformation, landlordInformation, propertyInformation){
   
    // console.log(tenantInformation)
    // console.log(landlordInformation)
    // console.log(propertyInformation)
   
    const newContract = new PDFDocument;

        var date = new Date()
        date = date.getDate() + "/" + date.getUTCMonth() + "/" + date.getFullYear()

        newContract.pipe(fs.createWriteStream(`./uploads/${propertyInformation._id}/${propertyInformation.name}-${tenantInformation.firstname}-${tenantInformation.lastname}-Contract-.pdf`))

        newContract.fontSize(18)
        .text(`Dated: ${date}`)
        .fontSize(26)
        .text(`${landlordInformation.firstname} ${landlordInformation.lastname}`, {align:'center'}, 200) 
        .text('and', {align:'center'}, 240)
        .text(`${tenantInformation.firstname} ${tenantInformation.lastname}`, {
            align:'center'
        }, 280)
        .fontSize(20)
        .text('Assured Shorthold Tenancy agreement', 130, 420)
        .addPage()
        .fontSize(12)
        .text(`This Agreement is made on ${date} between: \n\n${landlordInformation.firstname} ${landlordInformation.lastname} \n\n and \n\n${tenantInformation.firstname} ${tenantInformation.lastname} \n\n`)
        .text('This Agreement creates an Assured Shorthold Tenancy and the provisions for the recovery of posession in Section 21 of the Housing Act 1988 as amended by the Housing Act 1996 apply.')
        .text('\nIt is agreed between the parties as follows: \n\n')
        .text('1. Definitions')
        .text('In this Agreement the following words and expressions shall, where the context so admits, have the following meanings: \n\n')
        .text(`'the Deposit' means the sum payable in accordance with clause 4.1.\n\n`)
        .text(`'the Deposit Protection Scheme' means the scheme referred to in clause 4.3.\n\n`)
        .text(`'the End Date' means the last day of the fixed term being ${'[END OF CONTRACT DATE]'}\n\n`)
        .text(`'the Energy Performance Certificate' means the Energy Performance Certificate provided for in the Energy Performance of Buildings (England and Wales) Regulations 2012 as amended.`)
        .text('')
        
        newContract.end();
}

module.exports.createNewContract = createNewContract;