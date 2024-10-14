const fortune = require('./fortune')
const expressHandlebars = require('express-handlebars')
const db = require('../db')
const Vacation = require('../mongodb/models/vacation')

exports.form = (req, res) => res.render('layouts/form')

exports.home = (req, res) => res.render('home', { fortune: fortune.getFortune() })


exports.newsletter = (req, res) => {
    res.render('newsletter', { csrf: 'CSRF token goes here' })
}


/*
exports.listVacations = async (req, res) => {
    const vacations = await db.getVacations()
    const context = {
        vacations: vacations.map(vacation => ({
            sku: vacation.sky,
            name: vacation.name,
            description: vacation.description,
            price: '$' + vacation.price.toFixed(2),
            inSeason: vacation.inSeason,
        }))
    }
    res.render('vacations', context)
}
*/
/*
exports.listVacations = (req, res) => {
    Vacation.find({}, (err, vacations) => {
        const currency = req.session.currency || 'USD'
        const context = {
            currency: currency,
            vacations: vacations.map(vacation => {
                return {
                    sku: vacation.sku,
                    name: vacation.name,
                    description: vacation.description,
                    inSeason: vacation.inSeason,
                    price: convertFromUSD(vacation.price, currency),
                    qty: vacation.qty
                }
        })
    }
        switch(currency){
            case 'USD': context.currencyUSD = 'selected'; break
            case 'GBP': context.currencyGBP = 'selected'; break
            case 'BTC': context.currencyBTC = 'selected'; break
        }
        res.render('vacations', context)
    })
}
*/

exports.listVacations = async (req, res) => {
    try{
        const vacations = await db.getVacations({ available: true })
        const currency = req.session.currency || 'USD'
        const context = {
          currency: currency,
          vacations: vacations.map(vacation => {
            return {
              sku: vacation.sku,
              name: vacation.name,
              description: vacation.description,
              inSeason: vacation.inSeason,
              price: convertFromUSD(vacation.price, currency),
              qty: vacation.qty,
            }
          }),
        }
        switch(currency) {
          case 'USD': context.currencyUSD = 'selected'; break
          case 'GBP': context.currencyGBP = 'selected'; break
          case 'BTC': context.currencyBTC = 'selected'; break
        }
        res.render('vacations', context)

    }catch(err){
        console.log(err)
        res.render('303', err)
    }
  }
  

exports.getVacationInSeasonListener = async (req, res) => {
    const userEmail = await db.getVacationInSeasonListener()
    const context = {
        userEmail: userEmail.map(email => ({
            email: email.email
        }))
    }
    
    res.render('vacationsEmail', context)
}


exports.notifyWhenInSeasonForm = (req, res) => res.render('notifyWhenInSeasonForm', { sku: req.query.sku})

exports.notifyWhenInSeasonProcess = async (req, res) => {
    const {email, sku} = req.body
    await db.addVacationInSeasonListener(email, sku)
    return res.redirect(303, '/vacations')
}

exports.about = (req, res) => res.render('about')

exports.api = {

    newsletterSignup: (req, res) => {
        res.cookie('monster', 'nom nom')
        res.cookie('signed_monster', 'nom nom', {signed: true})
        req.session.userName = 'Robert'
        console.log('Form (from querystring:' + req.query.form)
        console.log('CSRF Token (from hidden form field:' + req.body._csrf)
        console.log('Name (from visible form field:' + req.body.name)
        console.log('Email (from visible form field:' + req.body.email)
        res.send( { result: 'sucess'})
    },
} 

exports.newsletterSignupThankYou = (req, res) => res.render('newsletter-signup-thank-you')

exports.photo = (req, res) => res.render('photo')

exports.vocationPhotoConestProcess = (req, res, fields, files) => {
    console.log('filed data: ', fields)
    console.log('files: ', files)
    res.redirect(303, '/about')
}

exports.notFound = (req, res) => res.render('404')

/* eslint-disable no-unused-vars */
exports.serverError = (err, req, res, next) => res.render('500')
/* eslint-disable no-unused-vars */

exports.header = (req, res) => {
    res.type('text/plain')
    const header = Object.entries(req.headers)
    .map(([key, value]) => `${key}: ${value}`)
    res.send(header.join('/n'))
}

exports.setCurrency = (req, res) => {
    req.ression.currency = req.params.currency
    return res.redirect(303, '/vacations')
}

function convertFromUSD(value, currency) {
    switch(currency){
        case 'USD': return value * 1 
        case 'GBP': return value * 0.79
        case 'BTC': return value * 0.00078
        default: return NaN
    }
}

