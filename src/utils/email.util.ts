import ejs from 'ejs'
import { createTransport } from 'nodemailer'
import path from 'path'
import {
    EmailSubject,
    EmailText,
    SendOtpType,
    __company_name__,
} from '../constants'

async function getTransporter() {
    let options = {
        host: process.env.SMTP_HOST,
        port: +process.env.SMTP_PORT,
        secure: true,
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASSWORD,
        },
    }

    return createTransport(options)
}

export const sendOtp = async (
    email: string,
    otp: number,
    type: SendOtpType
) => {
    const transporter = await getTransporter()

    let subject: string
    let text: string

    switch (type) {
        case SendOtpType.VERIFY:
            subject = EmailSubject.VerifyOtp
            text = EmailText.VerifyOtp
            break
        case SendOtpType.RESET:
            subject = EmailSubject.ResetOtp
            text = EmailText.ResetOtp
            break
        case SendOtpType.VERIFY_SECONDARY_EMAIL:
            subject = EmailSubject.verifySecondaryEmailOtp
            text = EmailSubject.verifySecondaryEmailOtp
            break
        default:
            subject = __company_name__ + ' - Your OTP'
            text = "Your Otp is here. Don't share"
            break
    }

    const html = await ejs.renderFile(
        path.join(path.resolve(), 'views', 'emails', 'otp.ejs'),
        { otp, text }
    )

    await transporter.sendMail({
        to: email,
        from: process.env.EMAIL,
        subject,
        html,
    })
}
