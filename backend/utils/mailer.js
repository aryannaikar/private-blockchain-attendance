const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "naikarxie@gmail.com",
    pass: process.env.EMAIL_PASS,
  },
});

const sendAbsenteeEmail = async (parentEmail, studentName, teacherName, className, time) => {
  const mailOptions = {
    from: process.env.EMAIL_USER || "naikarxie@gmail.com",
    to: parentEmail,
    subject: `Absence Alert: ${studentName}`,
    text: `Dear Parent, \n\nYour child "${studentName}" hasnt sat for lec of "${teacherName}" of class "${className}" during "${time}".\n\nRegards,\nBlockAttend System`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("📧 Email sent:", info.response);
    return info;
  } catch (err) {
    console.error("❌ Email failed:", err.message);
    throw err;
  }
};

module.exports = { sendAbsenteeEmail };
