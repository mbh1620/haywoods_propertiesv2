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
        .fontSize(10)
        .text(`This Agreement is made on ${date} between: \n\n${landlordInformation.firstname} ${landlordInformation.lastname} \n\n and \n\n${tenantInformation.firstname} ${tenantInformation.lastname} \n\n`)
        .text('This Agreement creates an Assured Shorthold Tenancy and the provisions for the recovery of posession in Section 21 of the Housing Act 1988 as amended by the Housing Act 1996 apply.')
        .text('\nIt is agreed between the parties as follows: \n\n')
        .text('1. Definitions\n\n')
        .text('In this Agreement the following words and expressions shall, where the context so admits, have the following meanings: \n\n')
        .text(`'the Deposit' means the sum payable in accordance with clause 4.1.\n\n`)
        .text(`'the Deposit Protection Scheme' means the scheme referred to in clause 4.3.\n\n`)
        .text(`'the End Date' means the last day of the fixed term being ${'[END OF CONTRACT DATE]'}\n\n`)
        .text(`'the Energy Performance Certificate' means the Energy Performance Certificate provided for in the Energy Performance of Buildings (England and Wales) Regulations 2012 as amended.\n\n`)
        .text(`'the Insured Risks' means fire, smoke, explosion, earthquake, storm, lightning, flooding, escape of water, subsidence, collision, falling trees, vandalism, theft, riot and civil comotion and any other risks which the Landlord decides to insure against.\n\n`)
        .text(`'the Lead Tenant' means one of the Tenants nominated to act on behalf of all the Tenants pursuant to the rules of the Deposit Protection Scheme.\n\n`)
        .text(`'the Premises' means the property known as ${propertyInformation.name} and the expression includes and improvements or additions made to the property by the Landlord.\n\n`)
        .text(`'the Prescribed Information' means the statutory information required by the Housing (Tenancy Deposits) (Prescribed Information) Order 2007.\n\n`)
        .text(`'the Rent' means the sum in clause 3.1.\n\n`)
        .text(`'the Right to Rent' means the right to rent property under the Immigration act 2014 and any other legislation governing the right to reside in and rent property in the United Kingdom.\n\n`)
        .text(`'the Start Date' means ${'[START DATE]'}\n\n`)
        .text(`'the Tenancy' means the Assured Shorthold Tenancy for the Term created by this Agreement.\n\n`)
        .text(`'the Term' means the fixed term of ${'[CONTRACT LENGTH]'} from and including the Start Date and the End Date or such earlier date on which this Agreement is terminated and any period during which the Tenants remain in possession by statutory right.\n\n`)
        .text(`'the Tribunal' means the First-tier Tribunal or Upper Tribunal.\n\n`)
        .text(`2. The Letting\n\n`)
        .text(`The Landlord lets and the Tenants take the Premises, for the Term.\n\n`)
        .text(`3. The Rent\n\n`)
        .text(`3.1  The Tenants shall pay the during the Term monthly in advance ${'[RENT PER MONTH]'} (or such other rent as agreed by the parties or determined by the Tribunal) on the ${'[PAYMENT DATE]'} of each month, the first payment to be made on or before the Start Date.\n\n`)
        .text(`3.2  Any payment for part of the month shall be calculated on a daily basis by apportioning the Rent for the number of days for that period for which the Rent is due in accordance with section 21C of the Housing Act 1998.\n\n`)
        .text(`3.3  The Rent shall be paid by direct debit into the Landlord's bank account.\n\n`)
        .text(`4. The Deposit\n\n`)
        .text(`4.1 On or before the Start Date, the Tenants shall pay to the Landlord the Deposit in the sum of £${'[RENT AMOUNT]'} as security against default by the Tenants of their responsibilities under this Agreement.\n\n`)
        .text(`4.2 The Landlord may use the Deposit as Compensation for:\n\n`)
        .text(`a.           arreas of Rent\n\n`)
        .text(`b.           amounts due for utilities for which the Tenants are responsible\n\n`)
        .text(`c.           amounts due for interest and any other charges for which the Tenants are responsible\n\n`)
        .text(`d.           the cost of making good any damage to the Premises, it's fixtures and fittings for which the Tenants are responsible \n\n`)
        .text(`e.           the cost of making good any failure by the Tenants in performing any other obligation under the Tenancy. \n\n`)
        .text(`4.3 The Deposit will be held under the custodial deposit protection scheme operated by the Deposit Protection Service of The Pavilions, Bridgwater Road, Bristol, BS99 6AA (Tel: 0330 303 0030)(Website: www.depositprotection.com). The Landlord will supply the Tenants with the tenancy deposit Prescribed Information within 30 days of receipt of the Deposit. \n\n`)
        .text(`4.4 The Landlord and Tenants agree to comply with the `)

        newContract.end();
}

module.exports.createNewContract = createNewContract;