import { User } from '../models/userSchema.js';
import jwt from 'jsonwebtoken';
import ErrorHandler from './error.js';
import { catchAsyncErrors } from './catchAsyncErrors.js';

export const isAuthenticated = catchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return next(new ErrorHandler('Login first to access this resource', 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    next();

});


//to ensure that only Auctioneers can create a auction
export const isAuthorized=(...roles)=>{
    return (req,res,next)=>{
        if(!roles.includes(req.user.role)){
            return next(new ErrorHandler(`Role (${req.user.role}) is not allowed to access this resource`,403));
            //403 is forbidden error
        }
        next();
    }
}