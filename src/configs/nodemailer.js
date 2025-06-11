const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.google.com",
  port: process.env.SMTP_PORT || 587,
  tls: {
    rejectUnauthorized: false,
  },
  secure: process.env.SMTP_PORT === "465", 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Nodemailer config error:", error);
  } else {
    console.log("Nodemailer is ready to send emails");
  }
});

module.exports = transporter;
