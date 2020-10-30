/**
 * Responds to any HTTP request.
 *
 * @param {!express:Request} req HTTP request context.
 * @param {!express:Response} res HTTP response context.
 */
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

sendBirthdayEmail = async (user) => {
  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    secure: true,
    port: 465,
    auth: {
      user: process.env.email_username,
      pass: process.env.email_password
    }
  });

  const mailOptions = {
    from: process.env.email_username,
    to: user.email,
    subject: `Happy Birthday! From PWA Pilipinas`,
    html: `
    <h2>Happy Birthday!</h2>
    <p>
      Hi ${user.displayName} @${user.username}!<br>
      <br>
      Happy Birthday! Maligayang bati! We're thankful for your contributions to the Progressive Web App community.
      May you stay healthy and happy all year round.<br>
      <br><br>
      Cheers!<br>
      Your PWA Pilipinas Community<br>
    </p>
    `
  };

  return await transporter.sendMail(mailOptions);
};

exports.dailyTask = async (req, res) => {
  function pad(n){ return n<10 ? +'0'+n : n }
  const localDate = new Date().toLocaleDateString("en-US", {timeZone: "Asia/Manila"}).split('/');
  const birthdayStrting = `${pad(localDate[0])}-${pad(localDate[1])}`;
  const querySnapshot = await admin.firestore().collection('users').where('birthday', '==', birthdayStrting).get();

  if(!querySnapshot.empty) {
    const data = [];
    querySnapshot.forEach(async (documentSnapshot) => {
      const user = documentSnapshot.data();
      if(user && user.birthday) {
        const emailFeedback = await sendBirthdayEmail(user);
        if(emailFeedback) data.push(user);
      }
    });
    res.status(200).send({ success: true, message: 'Users with birthday', data, bs: birthdayStrting });
  } else { 
    res.status(200).send({ success: true, message: 'Empty', bs: birthdayStrting });
  }
};
