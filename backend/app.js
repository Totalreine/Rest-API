const path = require('path')
const fs = require('fs')
const schema = require('./graphql/schema')
const resolver = require('./graphql/resolvers')
const auth = require('./middleware/auth')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const {graphqlHTTP} = require('express-graphql')

const app = express()

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images')
    },
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString() + '-' + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if(file.mimetype === 'image/png' || 'image/jpg' || 'image/jpeg') {
        cb(null, true)
    } else {
        cb(null, false)
    }

}

//const feedRoutes = require('./routes/feed')
//const authRoutes = require('./routes/auth')
// app.use(bodyParser.urlencoded()) // x-www-form-urlencoded <form>
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))

app.use(bodyParser.json()) // application/json

app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    if(req.method === 'OPTIONS') {
        return res.sendStatus(200)
    }
    next();
});

app.use(auth)

app.put('/post-image', (req, res, next) => {
    if(!req.isAuth) {
        throw new Error('not authenticated')
    }
    if(!req.file) {
        return res.status(200).json({message: 'No file provided'})
    }
    if(req.body.oldPath) {
        clearImage(req.body.oldPath)
    }
    return res 
    .status(201)
    .json({message: 'file stored', filePath: req.file.path})
})



app.use('/graphql', graphqlHTTP({
    schema: schema,
    rootValue: resolver,
    graphiql: true,
    customFormatErrorFn(err) {
        if(!err.originalError) {
            return err
        }
        const data = err.originalError.data
        const message = err.message || 'An error ocurred'
        const code = err.originalError.code || 500
        return { message: message, status: code, data: data }
    }
}))

app.use((error, req, res, next) => {
    console.log(error)
    const status = error.status || 500
    const message = error.message
    const data = error.data
    res.status(status).json({message: message, data: data})
})

mongoose
.connect('mongodb+srv://newUser:gakSEVoyZzYMzTGH@cluster0.bioyf.mongodb.net/messages?retryWrites=true&w=majority')
.then(result => {
     app.listen(8080)
})
.then(log => {console.log('connected to mongoose')} )
.catch(err => {
    console.log(err)
})

const clearImage = filePath => {
    filePath = path.join(__dirname, '..', filePath)
    fs.unlink(filePath, err => {console.log(err)})
}
