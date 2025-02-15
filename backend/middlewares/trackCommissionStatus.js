//this is a middleware to track the commission status of the user if the user has any unpaid commission 
//then the user cannot move forward until the user has paid the commission
import {User} from "../models/userSchema.js";
import {catchAsyncErrors} from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";

export const trackCommissionStatus = catchAsyncErrors(async(req,res,next)=>{
    const user=await User.findById(req.user._id);
    if(user.unpaidAmount>0){
        return next(new ErrorHandler("You have unpaid commission, please pay the commission to proceed",403));
    }
    next();

});