const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')


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

const feedRoutes = require('./routes/feed')
const authRoutes = require('./routes/auth')
// app.use(bodyParser.urlencoded()) // x-www-form-urlencoded <form>
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'))

app.use(bodyParser.json()) // application/json

app.use('/images', express.static(path.join(__dirname, 'images')))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use('/feed', feedRoutes)
app.use('/auth', authRoutes)

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
.catch(err => {
    console.log(err)
})
