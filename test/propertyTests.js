var server = require('../app.js')
var chai = require('chai')
var chaihttp = require('chai-http')
let should = chai.should;
var expect = chai.expect;
var chaiFiles = require('chai-files');
var request = require('supertest');

chai.use(chaihttp)

const userCredentials = {
    "username": "mbh",
    "password": "haywood",
  }
var authenticatedUser = request.agent(server)

beforeEach(function(done){
    authenticatedUser
    .post('/login')
    .set('Connection', 'keep-alive')
    .send(userCredentials)
    .end(function(err, res){
        console.log(res.status)
        // res.should.have.status(302)
        done()
    })
})

describe("Property 1 - Test moving in tenant route", () => {
    var propertyId = '6298c9ea31730d08a6b50503'
    it('Should send the workflow main page', (done) => {
        authenticatedUser
        .post(`/properties/${propertyId}/new-tenant`)
        .send({
                'firstname': 'Tenant',
                'lastname': 'Name',
                'email': 'jarynhappy@gmail.com',
                'mobile_number': '8093485234',
                'home_number': '90238490234',
                'propertyId': propertyId,
                'date_moved_in': '12/23/22',
                'CurrentTenant': true,
            }).end((err, res)=> {
            console.log(err)
            // res.should.have.status(200);
            done();
        })
    })
})