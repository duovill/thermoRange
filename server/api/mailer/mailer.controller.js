'use strict';

var _ = require('lodash');
var nodemailer = require('nodemailer');

exports.sendEmail = function(sender, recipients, subject, text) {

  var smtpConfig = {
    host: 'mail.impressive.hu',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: 'sygnusdev@greenpc.hu',
      pass: 'PzzW4Qbbd'
    }
  };

  //reusable transporter object using the default SMTP transport
  var transporter = nodemailer.createTransport(smtpConfig);
  console.log(recipients);
  // setup e-mail data with unicode symbols
  var mailOptions = {
    from: sender, // sender address ex. '"Fred Foo " <foo@foo.com>'
    to: recipients, // list of receivers ex. 'foo1@foo.com, foo2@foo.com'
    subject: subject, // Subject line
    text: '', // plaintext body
    html: text // html body
  };

  console.log('options');
  console.log(mailOptions);
  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: ' + info.response);
  });

};

//This can be called from front-end
exports.send = function(req, res) {
  if ((req.data.sender != undefined) &&
    (req.data.recipients != undefined) &&
    (req.data.subject != undefined) &&
    (req.data.text != undefined)) {
    sendEmail(req.data.sender, req.data.recipients, req.data.subject, req.data.text)
  } else {
    res.status(400).send('Invalid data');
  }
};


