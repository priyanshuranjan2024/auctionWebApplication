class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.message = message;
    }
}

export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal Server Error";
    err.statusCode = err.statusCode || 500;
    if (err.name === "JsonWebTokenError") {
        const message = "Invalid token. Please login again";
        err = new ErrorHandler(message, 400);
    }
    if (err.name === "TokenExpiredError") {
        const message = "Token expired. Please login again";
        err = new ErrorHandler(message, 400);
    }
    if (err.name === "CastError") { //this error occurs when we pass an invalid id to findById
        const message = `Resource not found. Invalid: ${err.path}`;
        err = new ErrorHandler(message, 404);
    }

    const errorMessages = err.errors ? Object.values(err.errors).map(val => val.message).join(" ") : err.message;

    return res.status(err.statusCode).json({
        success: false,
        message: errorMessages
    });



}


export default ErrorHandler;