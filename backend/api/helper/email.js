const nodemailer = require("nodemailer");
const pdf = require("pdf-creator-node");
const fs = require("fs");
const moment = require("moment");
const puppeteer = require("puppeteer");
const { trusted } = require("mongoose");


// send mail function
exports.SendMail = async (to, subject, message) => {
    try {
        let transporter = nodemailer.createTransport({
            host: "mail.saturncube.com",
            port: 465,
            secure: trusted,
            // secure: false, // true for 465, false for other ports
            auth: {
                user: "samay.bhavsar@saturncube.com",
                pass: "samay.sc@24",
            },
            tls: {
                rejectUnauthorized: false // Add this option
            }
        });
        let info = await transporter.sendMail({
            from: "samay.bhavsar@saturncube.com", // sender address
            to: to, // list of receivers
            subject: subject, // Subject line
            html: message, // html body
        });
        console.log(info);
        return info;
    } catch (err) {
        console.log(err);
        return err;
    }
};

//send mail with reply
exports.SendMailReply = async (to, subject, message, replyTo = null) => {
    try {
        let transporter = nodemailer.createTransport({
            host: "mail.saturncube.com",
            port: 465,
            secure: true,
            auth: {
                user: "mukesh.khatavani@saturncube.com",
                pass: "Mukesh@2812Khatri",
            },
        });

        let mailOptions = {
            from: "mukesh.khatavani@saturncube.com",
            to: to,
            subject: subject,
            html: message,
        };

        if (replyTo) {
            mailOptions.replyTo = replyTo;
        }

        let info = await transporter.sendMail(mailOptions);
        console.log(info);
        return info;
    } catch (err) {
        console.log(err);
        return err;
    }
};

exports.verificationMail = (otp) => `<!DOCTYPE html>
<html>

<head>
    <title>Signup email verification OTP</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <link
        href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
        rel="stylesheet">
    <style>
        body,
        table,
        td,
        a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
        }

        table,
        td {
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }

        img {
            -ms-interpolation-mode: bicubic;
        }

        /* RESET STYLES */
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
        }

        table {
            border-collapse: collapse !important;
        }

        body {
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
        }

        @media screen and (max-width:600px) {
            h1 {
                font-size: 30px !important;
                line-height: 34px !important;
            }

            h2 {
                font-size: 18px !important;
                line-height: 26px !important;
            }

            .profile {
                width: 180px;
            }
        }
    </style>
</head>

<body style="margin: 0 !important; padding: 0 !important; font-family: 'Rubik', sans-serif;">
    <div style="max-width: 900px; margin: 0 auto; padding: 0; width: 100%;">
        <table border="0" bgcolor="#566DCB" cellpadding="0" cellspacing="0" width="100%">

            <tr>
                <td bgcolor="#000" align="center" style="padding-top: 30px; padding-bottom: 25px;">
                    <h1
                        style="font-family: 'Rubik', sans-serif; font-size:40px; line-height:48px; color: #fff; padding-bottom: 15px; margin: 0;">
                        PMS. </h1>

                </td>
            </tr> <!-- body content -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody>
                    <tr>
                        <td bgcolor="#fff"
                            style="padding: 19px 33px 16px 33px; font-size: 20px; line-height: 28px;color: #200E32; text-align: center;">
                            <h2 style="margin: 0; ">EMAIL VERIFIATION!</h2>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#fff" style="padding: 0 33px 28px 33px; color: #000; ">
                            <p style="font-size:20px; line-height: 28px; margin: 0;">It's seem you are singed up at
                                PMS and trying to verify your email address</p>
                            <p style="font-size:20px; line-height: 28px; margin: 0;">Here is verification code. Please
                                copy it and verify your email.</p>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#000" style="padding: 0; margin-bottom: 28px; text-align: center; color: #fff; ">
                            <h2>CODE: ${otp}</h2>
                        </td>
                    </tr>
                    <tr>
                        <td bgcolor="#fff" style="padding: 28px 33px 10px 33px; color: #200E32; ">
                            <p style="font-size:20px; line-height: 28px; margin: 0;">Regards, <br> Team PMS App</p>
                        </td>
                    </tr>
                </tbody>
            </table> <!-- footer -->
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tbody>
                    <tr>
                        <td align="center" bgcolor="#000" style="padding: 12px; color: #fff;">
                            <p style="text-align: center; font-size: 14px; line-height: 20px; margin: 0;"> Sent by
                                PMS. | Copyright PMS., 2023 </p>
                        </td>
                    </tr>
                </tbody>
            </table>
        </table>
    </div>
</body>

</html>`;
// exports.verificationMail = (otp) => `<!DOCTYPE html>
// <html>

// <head>
//     <title>Email verification code</title>
//     <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
//     <meta firstName="viewport" content="width=device-width, initial-scale=1">
//     <meta http-equiv="X-UA-Compatible" content="IE=edge">
//     <link
//         href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap"
//         rel="stylesheet">
//     <style>
//         body,
//         table,
//         td,
//         a {
//             -webkit-text-size-adjust: 100%;
//             -ms-text-size-adjust: 100%;
//         }

//         table,
//         td {
//             mso-table-lspace: 0pt;
//             mso-table-rspace: 0pt;
//         }

//         img {
//             -ms-interpolation-mode: bicubic;
//         }

//         /* RESET STYLES */
//         img {
//             border: 0;
//             height: auto;
//             line-height: 100%;
//             outline: none;
//             text-decoration: none;
//         }

//         table {
//             border-collapse: collapse !important;
//         }

//         body {
//             height: 100% !important;
//             margin: 0 !important;
//             padding: 0 !important;
//             width: 100% !important;
//         }

//         @media screen and (max-width:600px) {
//             h1 {
//                 font-size: 30px !important;
//                 line-height: 34px !important;
//             }

//             h2 {
//                 font-size: 18px !important;
//                 line-height: 26px !important;
//             }

//             .profile {
//                 width: 180px;
//             }
//         }
//     </style>
// </head>

// <body style="margin: 0 !important; padding: 0 !important; font-family: 'Rubik', sans-serif;">
//     <div style="max-width: 900px; margin: 0 auto; padding: 0; width: 100%;">
//         <table border="0" cellpadding="0" cellspacing="0" width="100%">

//             <tr>
//             <td bgcolor="#ffffff" align="center" style="padding-top: 30px; padding-bottom: 25px;">
//               <h2>Dawai APP</h2>
//             </td>

//             </tr> <!-- body content -->
//             <table border="0" cellpadding="0" cellspacing="0" width="100%">
//                 <tbody>
//                     <tr>
//                         <td bgcolor="#fff" style="padding: 0 33px 0px 33px; color: #000; ">
//                             <p style="font-size:20px; line-height: 28px; margin: 0;">Here is verification code. Please
//                             copy it and verify your email. <br><br></p>
//                         </td>
//                     </tr>
//                     <tr>
//                         <td style="padding: 0; text-align: center; color: #000000; background:white; ">
//                             <h2><span style="color: #000; line-height: 30px; font-weight: 100">VERIFICATION CODE:</span>  <b>${otp}</b></h2>
//                         </td>
//                     </tr>

//                 </tbody>
//             </table> <!-- footer -->
//         </table>
//     </div>
// </body>

// </html>`;

// Function to generate subscription invoice PDF
exports.makePdf = async (data, type) => {
    try {
        const pdfName = data._id;
        try {
            if (!fs.existsSync("./uploads/pdf")) {
                fs.mkdirSync("./uploads/pdf", { recursive: true });
            }
        } catch (err) {
            console.error(err);
        }

        const outputPath = "./uploads/pdf/" + pdfName + ".pdf";
        let htmlContent;
        if (type == 1) {
            htmlContent = fs.readFileSync("./templates/subscription.html", "utf-8");
        }

        htmlContent = await replacePlaceholders(htmlContent, data);

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox"],
        });
        const page = await browser.newPage();

        // Set content of the page with your HTML
        await page.setContent(htmlContent);

        let options = {
            format: "A4",
            orientation: "portrait",
            border: "1mm",
        };

        // Generate PDF from the HTML content
        let created_pdf = await page.pdf({ path: outputPath, options });
        return created_pdf;
    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.get_content = async (data, type) => {
    try {
        let htmlContent;
        if (type == 1) {
            htmlContent = fs.readFileSync("./templates/support_query.html", "utf-8");
        }

        htmlContent = await replacePlaceholders(htmlContent, data);

        return htmlContent;
    } catch (error) {
        console.log(error);
        return error;
    }
};

async function replacePlaceholders(htmlContent, data) {
    // Replace placeholders in the HTML with actual data
    for (const key in data) {
        const regex = new RegExp(`{${key}}`, "g");
        htmlContent = htmlContent.replace(regex, data[key]);
    }
    return htmlContent;
}
