export const ErrorType = {
    PasswordMissing: 101,
    EmailMissing: 102,
    AuthorizationMissing: 103,
    AuthorizationExpired: 104,
    AuthorizationInvalid: 105,
    EmailAlreadyExist: 106,
    UsernameAlreadyExist: 107,
    InvalidRole: 108,
    UsernameOrEmailUnavailable: 109,
    IncorrectPassword: 110,
    InvalidUrl: 111,
    UrlExpired: 112,
    UrlNotAvailable: 113,
    UrlAlreadyExist: 114,
    UserUnavailable: 115,
    VerificationLinkExpired: 116,
    EmailAlreadyVerfified: 117,
    RateLimitExceded: 118,
    NotAuthorized: 119,
    PlanIdMissing: 120,
    PlanUnavailable: 121,
    PlanPriceMissing: 122,
    PlanNameMissing: 123,
    PlanAlreadyExist: 124,
    PaymentFailed: 125,
    InvalidSignature: 126,
    PaymentUnavailable: 127,
    MaxCustomSlugReached: 128,
    LongUrlMissing: 129,
    MaxUrlReached: 130,
    MaxClicksReached: 131,
    RefreshTokenMissing: 132,
    UserDeactivated: 133,
    InvalidRefreshToken: 134,
};

interface ErrorResponse {
    errorCode: number;
    message: string;
    statusCode: number;
}

export function HandleServerError(type: number): ErrorResponse {
    switch (type) {
        case ErrorType.EmailMissing:
            return {
                errorCode: type,
                message: "No Email Provided",
                statusCode: 400,
            };
        case ErrorType.PasswordMissing:
            return {
                errorCode: type,
                message: "No Password Provided",
                statusCode: 400,
            };
        case ErrorType.AuthorizationMissing:
            return {
                errorCode: type,
                message: "Authorization Missing",
                statusCode: 403,
            };
        case ErrorType.AuthorizationExpired:
            return {
                errorCode: type,
                message: "Authorization Expired",
                statusCode: 403,
            };
        case ErrorType.AuthorizationInvalid:
            return {
                errorCode: type,
                message: "Authorization Invalid",
                statusCode: 403,
            };
        case ErrorType.EmailAlreadyExist:
            return {
                errorCode: type,
                message: "Email Already Exist",
                statusCode: 400,
            };
        case ErrorType.UsernameAlreadyExist:
            return {
                errorCode: type,
                message: "Username Already Exist",
                statusCode: 400,
            };
        case ErrorType.InvalidRole:
            return {
                errorCode: type,
                message: "Invalid Role",
                statusCode: 400,
            };
        case ErrorType.UsernameOrEmailUnavailable:
            return {
                errorCode: type,
                message: "Username Or Email Not Found",
                statusCode: 400,
            };
        case ErrorType.IncorrectPassword:
            return {
                errorCode: type,
                message: "Password Incorrect",
                statusCode: 400,
            };
        case ErrorType.InvalidUrl:
            return {
                errorCode: type,
                message: "Invalid Url Provided",
                statusCode: 400,
            };
        case ErrorType.InvalidRefreshToken:
            return {
                errorCode: type,
                message: "Invalid Refresh Token Provided",
                statusCode: 400,
            };
        case ErrorType.UserDeactivated:
            return {
                errorCode: type,
                message: "User Deactivated",
                statusCode: 403,
            };
        case ErrorType.InvalidSignature:
            return {
                errorCode: type,
                message: "Invalid Signature Provided",
                statusCode: 400,
            };
        case ErrorType.UrlExpired:
            return {
                errorCode: type,
                message: "Url Expired",
                statusCode: 400,
            };
        case ErrorType.UrlNotAvailable:
            return {
                errorCode: type,
                message: "Url Unavailable",
                statusCode: 400,
            };
        case ErrorType.PaymentUnavailable:
            return {
                errorCode: type,
                message: "Payment Unavailable",
                statusCode: 400,
            };
        case ErrorType.MaxCustomSlugReached:
            return {
                errorCode: type,
                message: "Max Custom Slug Reached",
                statusCode: 400,
            };
        case ErrorType.MaxUrlReached:
            return {
                errorCode: type,
                message: "Max Url Reached",
                statusCode: 400,
            };
        case ErrorType.MaxClicksReached:
            return {
                errorCode: type,
                message: "Max Url Clicks Reached",
                statusCode: 400,
            };
        case ErrorType.UrlAlreadyExist:
            return {
                errorCode: type,
                message: "Url Already Exist",
                statusCode: 409,
            };
        case ErrorType.PlanAlreadyExist:
            return {
                errorCode: type,
                message: "Plan Already Exist",
                statusCode: 409,
            };
        case ErrorType.UserUnavailable:
            return {
                errorCode: type,
                message: "User Unavailable",
                statusCode: 400,
            };
        case ErrorType.PlanIdMissing:
            return {
                errorCode: type,
                message: "PlanId Not Provided",
                statusCode: 400,
            };
        case ErrorType.PlanPriceMissing:
            return {
                errorCode: type,
                message: "Plan Price Not Provided",
                statusCode: 400,
            };
        case ErrorType.RefreshTokenMissing:
            return {
                errorCode: type,
                message: "Refresh Token Not Provided",
                statusCode: 400,
            };
        case ErrorType.LongUrlMissing:
            return {
                errorCode: type,
                message: "Long Url Not Provided",
                statusCode: 400,
            };
        case ErrorType.PlanNameMissing:
            return {
                errorCode: type,
                message: "Plan Name Not Provided",
                statusCode: 400,
            };
        case ErrorType.PlanUnavailable:
            return {
                errorCode: type,
                message: "Plan Unavailable",
                statusCode: 400,
            };
        case ErrorType.PaymentFailed:
            return {
                errorCode: type,
                message: "Payment Unsuccessful",
                statusCode: 400,
            };
        case ErrorType.EmailAlreadyVerfified:
            return {
                errorCode: type,
                message: "User Email Already Verified",
                statusCode: 409,
            };
        case ErrorType.VerificationLinkExpired:
            return {
                errorCode: type,
                message: "Verification Link Expired",
                statusCode: 400,
            };
        case ErrorType.RateLimitExceded:
            return {
                errorCode: type,
                message: "RateLimit Exceded. Try again later",
                statusCode: 429,
            };
        case ErrorType.NotAuthorized:
            return {
                errorCode: type,
                message: "Not Authorized",
                statusCode: 403,
            };
        default:
            return {
                errorCode: 100,
                message: "Something Went Wrong",
                statusCode: 500,
            };
    }
}
