const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const nedb = require('nedb');
const path = require('path');
var {newStr , revStr} = require('./functions/regex');
var {encrypt , decrypt} = require('./config/crypto');
var QRCode = require('qrcode');
const { share } = require('./mail/share');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.listen('3000',()=>{
    console.log('running on port 3000')
})

app.get('/', (req,res)=>{
    res.render('index')
})

const Sitename = 'http://localhost:3000/';
app.post('/post', (req,res)=>{
    const data = req.body; // to be push to a database if needed 
    console.log(data)
    const message = data.message
    const password = data.password || '1234'
    const time = Date.now();
    const hash = {
        message : message,
        time : time // Dont really see the use for timestamp
    }
    const hashed = encrypt(hash, password);// hashing the message with a key
    const toRegex = newStr(hashed);// converting all '/' to '-' so it can be passed as a url params

    QRCode.toFile(`public/qr/${time}.png`, `${Sitename}cy/${toRegex}`, {
        color: {
          dark: '#00F',  // Black dots
          light: '#0000' // Transparent background
        }
      }, function (err) {
        if (err) throw err
      })
    res.render('qrOut',{
        image: time
    })
})

// Route When User Scan The Code 
app.get('/cy/:id', (req,res)=>{
    const id = req.params.id;
    const fromRegex = revStr(id);
    res.render('lock',{
        data: fromRegex
    })
})

app.get('/test', (req,res)=>{
    
    const fromRegex = 'U2FsdGVkX18iG35AWPEnaVyDzxWLZEmuOJ3-RexnBHcT2nWWlGQN8sXTPY+50U0c9io-WuWGiqk=';
    res.render('lock',{
        data: fromRegex
    })
})

// Route When User Input password to unlock phase
app.post('/cy/unlock', (req,res) =>{
    const id = req.body.id;
    const p = req.body.p;
    const fromRegex = revStr(id);
    const unhash = decrypt(fromRegex,p);
    res.render('unlock',{
        data: unhash
    })
})

app.post('/share', (req,res) =>{
    const email = req.body.email;
    const image = req.body.image;
    share(email,image);
  
    res.send('Sent Mail ;-D')
})
