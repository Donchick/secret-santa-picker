var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
const bodyParser = require('body-parser');

console.log(process.env.EMAIL);
console.log(process.env.EMAIL_PASSWORD);
const PORT = process.env.PORT || 5000;
const EMAIL = process.env.EMAIL;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;

var app = express();
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL,
    pass: EMAIL_PASSWORD,
  }
});

app.use(logger('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(bodyParser.json());

const CONTACT_TYPES = new Map([['email', 'EMAIL']]);
const CONTACT_VALIDATION_PATTERN = new Map([[
    'EMAIL', /[^@]+@[^@].\w+/,
]]);

const CONTACT_TYPE_NOTIFIER = {
  'EMAIL': emailClient,
};

app.get('/', (req, res) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  res.sendFile(path.join(__dirname, 'client/build') + '/index.html');
});

app.post('/api/pick-secret-santa', async (req, res, next) => {
  const options = req.body;

  const errors = validateSecretSantaOptions(options);

  if (errors) {
    return res.status(400).send({
      errors,
    });
  }

  for(let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = options[j];
    options[j] = options[i];
    options[i] = temp;
  }

  const promises = [];

  if (options.length > 3) {
    for (let i = 0; i < options.length; i++) {
      if (i === options.length - 1) {
        promises.push(notifySecretSanta(options[i], options[0].nickname));
      } else {
        promises.push(notifySecretSanta(options[i], options[i + 1].nickname));
      }
    }
  } else {
    const associatedIndexesArray = [0, 1, 2];

    for(let i = 0; i < options.length; i++) {
      const index = Math.floor(Math.random() * (associatedIndexesArray.length));
      promises.push(notifySecretSanta(options[i], options[associatedIndexesArray[index]].nickname));
      associatedIndexesArray.splice(index, 1);
    }
  }

  try {
    await Promise.all(promises);
  } catch (e) {
    console.log(e);
    return res.status(400).send({
      errors : ['Secret Santas notification failed'],
    });
  }

  res.send('OK');
});

function notifySecretSanta(santa, clientName) {
  return CONTACT_TYPE_NOTIFIER[CONTACT_TYPES.get('email')].call(this, santa, clientName);
}

function emailClient(santa, clientName) {
  return new Promise((res, rej) => {
    transporter.sendMail({
      to: santa.contact,
      subject: 'You\'re Secret Santa now ho-ho-ho',
      text: `
      Hello Secret Santa(${santa.nickname})!
      
      You're Santa for ${clientName}.
      
      Happy Holidays, ho-ho-ho!`
    }, function(error){
      if (error) {
        rej(error);
      } else {
        res();
      }
    });
  })
}

function validateSecretSantaOptions(options) {
  const errors = [];
  const namesSet = new Set();
  const contactsSet = new Set();
  let minCountError = false;
  let incompleteOption = false;
  let duplicatedNames = false;
  let duplicatedContacts = false;
  let invalidContact = false;

  if (options.length < 3) {
    minCountError = true;
  }

  for(let i = 0; i < options.length; i++) {
    if (!(options[i].nickname && options[i].contact)) {
      incompleteOption = true;
      continue;
    }

    invalidContact = invalidContact || !CONTACT_VALIDATION_PATTERN
        .get(CONTACT_TYPES.get('email')).test(options[i].contact);

    duplicatedNames = duplicatedNames || namesSet.has(options[i].nickname);
    namesSet.add(options[i].nickname);

    duplicatedContacts = duplicatedContacts || contactsSet.has(options[i].contact);
    contactsSet.add(options[i].contact);
  }

  if (minCountError) {
    errors.push('Minimum number of players is 3');
  }
  if (incompleteOption) {
    errors.push('One of Secret Santas is incomplete');
  }
  if (invalidContact) {
    errors.push('One of Secret Santas has invalid contact info');
  }
  if (duplicatedNames) {
    errors.push('Some of Secret Santas have duplicated names');
  }
  if (duplicatedContacts) {
    errors.push('Some of Secret Santas have duplicated contacts');
  }

  return errors.length > 0 ? errors : null;
}

app.listen(PORT, function () {
  console.log(`Express server listening on port ${PORT}`)
});

module.exports = app;
