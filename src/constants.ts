export const __prod__ = process.env.NODE_ENV === 'production'
export const __company_name__ = 'Telecord'

export enum SendOtpType {
    VERIFY,
    RESET,
    VERIFY_SECONDARY_EMAIL,
}

export const EmailSubject = {
    VerifyOtp: 'Verify your email to activate your account',
    ResetOtp: 'OTP for password reset request',
    verifySecondaryEmailOtp:
        'Verify your secondary email to keep your account safe',
}

export const EmailText = {
    VerifyOtp: `Thanks for choosing ${__company_name__}. Please signup with OTP to continue.`,
    ResetOtp:
        'A password request is received for this account. Use this OTP is to continue.',
    verifySecondaryEmailOtp: 'OTP for verification of secondary email.',
}

export enum UploadType {
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    ANY = 'any',
}
