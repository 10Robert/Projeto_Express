const express = require('express')
const expressHandlebars = require('express-handlebars')
const handlers = require('./lib/handlers')
const bodyParser = require('body-parser')
const multiparty = require('multiparty')
const app = express();
const credentials = require('./config')
const cookieParser = require('cookie-parser')
const flashMiddleware = require('./lib/middleware/flash')
const cluster = require('cluster')
const session = require('express-session') 
const redis = require('redis')
const RedisStore = require('connect-redis') + (session)
const redisClient = redis.createClient()

require('./db') 

function startServer(port) {
    app.listen(port, function() {
      console.log(`Express started in ${app.get('env')} ` +
        `mode on http://localhost:${port}` +
        `; press Ctrl-C to terminate.`)
    })
  }
  
  if(require.main === module) {
    // application run directly; start app server
    startServer(process.env.PORT || 8080)
  } else {
    // application imported as a module via "require": export
    // function to create server
    module.exports = startServer
  }




app.use((req, res, next) => {
    if(cluster.isWorker)
        console.log(`Worker ${cluster.worker.id} received request`)
    next()
})

app.use(cookieParser(credentials.cookieSecret))


app.use(session({
    resave:false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    
}))
    
app.use(express.static(__dirname + '/public'))

// configura a view engine Handlebars
app.engine('handlebars', expressHandlebars({
    defaultLayout: 'main',
}))

app.set('view engine', 'handlebars') 

app.use(bodyParser.json())

app.use(bodyParser.urlencoded({ extended: true }))

app.use(flashMiddleware)

app.get('/about', handlers.about)

app.get('/set-currency/:currency', handlers.setCurrency)

app.get('/vacations', handlers.listVacations)
app.get('/notifyWhenInSeasonForm', handlers.notifyWhenInSeasonForm)
app.post('/notify-me-when-in-season', handlers.notifyWhenInSeasonProcess)
app.get('/vacations/emails', handlers.getVacationInSeasonListener)


app.get('/fail', (req, res) => {
    throw new Error ('Nope!')

})

app.get('/epic-fail', (req, res) => {
    process.nextTick(() => {
        throw new Error('Kaboom!')
    })
})


app.get('/header', handlers.header)

app.get('/form', handlers.form)

app.get('/', handlers.home)

app.get('/newsletter', handlers.newsletter)

app.post('/api/newsletter-signup', handlers.api.newsletterSignup)

app.get('/photo', handlers.photo)

app.post('/vocation-photo', (req, res) => {
    const form = new multiparty.Form()
    form.parse(req, (err, fields, files) => {
        if(err) return res.status(500).send({ error: err.message})
        handlers.vocationPhotoConestProcess( req, res, fields, files)
    })
})

process.on('uncaughtException', err => {
    console.error('UNCAUGHT EXCEPTION\n', err.stack);
    // faça a limpeza que precisar aqui...feche
    //conexões de banco de dados etc
    process.exit()
})

app.use(handlers.notFound)

app.use(handlers.serverError)

app.use((err, req, res ,next) => {
    console.error(err.message, err.stack)
    app.status(500).render('500')
})




