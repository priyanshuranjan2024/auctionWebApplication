import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { User } from "../models/userSchema.js";
import { v2 as cloudinary } from "cloudinary";
import { generateToken } from "../utils/jwtToken.js";



export const register = catchAsyncErrors(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length == 0) {
        return next(new ErrorHandler("Please upload a picture", 400));
    }

    const { profileImage } = req.files;
    const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(profileImage.mimetype)) {
        return next(new ErrorHandler("Please upload correct image format", 400));
    }

    const { userName, password, email, phone, role, bankAccountNumber, bankAccountName, bankName, paytmNumber, paypalEmail } = req.body;
    if (!userName || !password || !email || !phone || !role) {
        return next(new ErrorHandler("Please fill all fields", 400));
    }
    if (role == "Auctioneer") {
        if (!bankAccountName || !bankAccountNumber || !bankName) {
            return next(new ErrorHandler("Please provide full bank details", 400));
        }
        if (!paytmNumber) {
            return next(new ErrorHandler("Please provide paytm Number details", 400));
        }
        if (!paypalEmail) {
            return next(new ErrorHandler("Please provide paypal Email details", 400));
        }
    }

    const isRegistered = await User.findOne({ email });
    if (isRegistered) {
        return next(new ErrorHandler("User already exists", 400));
    }
    const cloudinaryResponse = await cloudinary.uploader.upload(profileImage.tempFilePath, {
        folder: "AUCTION_USERS",
    });
    if (!cloudinaryResponse || cloudinaryResponse.error) {
        console.error(cloudinaryResponse.error || "Cloudinary error");
        return next(new ErrorHandler("Failed to upload image to cloudinary", 500));
    }

    //now image is uploaded
    const user = await User.create({
        userName, email, password, phone, role,
        profileImage: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        },
        paymentMethods: {
            bankTransfer: {
                bankAccountNumber,
                bankAccountName,
                bankName,
            },
            paytm: {
                paytmNumber,
            },
            paypal: {
                paypalEmail,
            },
        }
    });
    generateToken(user, "User registered successfully", 201, res);


});

export const login = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new ErrorHandler("Please fill all fields", 400));
    }
    //now validate
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
        return next(new ErrorHandler("Invalid credentials", 401));
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        return next(new ErrorHandler("Invalid credentials", 401));
    }
    generateToken(user, "User logged in successfully", 200, res);

});

export const getProfile = catchAsyncErrors(async (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
});

export const logout = catchAsyncErrors(async (req, res, next) => {
    res.status(200).cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true
    }).json({
        success: true,
        message: "Logged out successfully",
    })
});

export const fetchLeaderboard = catchAsyncErrors(async (req, res, next) => {
    const users= await User.find({moneySpent:{$gt:0}});
    const leaderboard=users.sort((a,b)=>b.moneySpent-a.moneySpent);//sorting in descending order
    res.status(200).json({
        success:true,
        leaderboard,
    });
 });

