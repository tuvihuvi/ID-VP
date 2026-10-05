const express = require('express');
const dateTimeET = require('./src/dateTimeET');
const fs = require('fs').promises;
const bodyparser = require('body-parser');
const path = require('path');

const textRef = path.join(__dirname, 'public', 'txt', 'vanasonad.txt');
const regtextRef = path.join(__dirname, 'public', 'txt', 'visits.txt');

const app = express();

// Renderdusmootor EJS
app.set('view engine', 'ejs');

// Avalik kaust staatilistele failidele (pildid, txt)
app.use(express.static('public'));

// Vormide parsimine (POST päringud)
app.use(bodyparser.urlencoded({extended: false}));

// MARSRUUT: Avaleht  ->  views/index.ejs
app.get('/', (req, res) => {
    res.render('index', {
        dayNow: dateTimeET.day(),
        dateNow: dateTimeET.date(0),
        timeNow: dateTimeET.time()
    });
});

// MARSRUUT: Vanasõna  ->  views/vanasona.ejs
app.get('/vanasona', async (req, res) => {
    try {
        const data = await fs.readFile(textRef, 'utf8');
        let vanasona = data.split(";");
		res.render('vanasona', {wisdom: vanasona[Math.round(Math.random() * (vanasona.length - 1))]});
	}
	catch (err) {
		console.log(err);
		res.render('vanasona', {wisdom: 'Kahjuks ei leidnud ühtegi vanasõna!'});
    }
});

// MARSRUUT: Minust  ->  views/minust.ejs
app.get('/minust', (req, res) => {
    res.render('minust');
});

// MARSRUUT: Külastuse registreerimine
app.get('/regvisit', (req, res) => {
    res.redirect('/');
});

app.post('/regvisit', async (req, res) => {
    try {
        // komad ja semikoolonid eemaldame nimest, sest need on failis eraldajad
        const userName = (req.body.name || '').replace(/[,;]/g, ' ').trim();
        if (userName) {
            // formaat: nimi, kuupäev, kellaaeg;
            await fs.appendFile(regtextRef, userName + ', ' + dateTimeET.date() + ', ' + dateTimeET.time() + ';');
        }
        res.redirect('/viimane');
    }
    catch (err) {
        console.log(err);
        res.redirect('/');
    }
});

// MARSRUUT: Viimane külastus  ->  views/viimane.ejs
app.get('/viimane', async (req, res) => {
    const puudub = 'Külastusi pole veel registreeritud.';
    try {
        const data = await fs.readFile(regtextRef, 'utf8');
        const visits = data.split(';');           // viimane element on tühi
        if (visits.length < 2) {
            return res.render('viimane', {tekst: puudub});
        }
        const last = visits[visits.length - 2];   // viimane külastus on eelviimane element
        const parts = last.split(',');            // [nimi, kuupäev, kellaaeg]
        const name = parts[0].trim();
        const date = parts[1].trim();
        const time = parts[2].trim();
        res.render('viimane', {tekst: 'Viimati registreeriti külastus ' + date + ', kell ' + time + ' kui seda tegi ' + name + '.'});
    }
    catch (err) {
        console.log(err);
        res.render('viimane', {tekst: puudub});
    }
});

// Serveri käivitamine
app.listen(5216, () => {
    console.log('✅ Server töötab!');
});
