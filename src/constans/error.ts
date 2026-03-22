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
        case ErrorType.UrlAlreadyExist:
            return {
                errorCode: type,
                message: "Url Already Exist",
                statusCode: 400,
            };
        default:
            return {
                errorCode: 100,
                message: "Something Went Wrong",
                statusCode: 500,
            };
    }
}
