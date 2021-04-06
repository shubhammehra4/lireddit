import nodemailer from "nodemailer";

export async function sendEmail(to: string, text: string) {
    // let testAccount = await nodemailer.createTestAccount();

    // console.log(testAccount);
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "x7srwixflb3flfpp@ethereal.email", // generated ethereal user
            pass: "VtfCKpTf1QNFMRPKp", // generated ethereal password
        },
    });

    let info = await transporter.sendMail({
        from: '"Fred Foo 👻" <foo@example.com>', // sender address
        to, // list of receivers
        subject: "Change Password", // Subject line
        html: `<b>${text}</b>`, // html body
    });

    console.log("Message sent: %s", info.messageId);

    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
