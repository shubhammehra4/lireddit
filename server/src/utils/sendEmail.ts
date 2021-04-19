import nodemailer from "nodemailer";

export async function sendEmail(to: string, text: string, subject?: string) {
    let testAccount = await nodemailer.createTestAccount();

    console.log(testAccount);
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });

    let info = await transporter.sendMail({
        from: "Lireddit",
        to,
        subject: subject ? subject : "LiReddit",
        html: `<b>${text}</b>`,
    });

    console.log("Message sent: %s", info.messageId);

    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}
