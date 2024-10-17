import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { v2 as cloudinary } from "cloudinary";


export const addNewAuctionItem = catchAsyncErrors(async (req, res, next) => {
    if (!req.files || Object.keys(req.files).length == 0) {
        return next(new ErrorHandler("Auction Item Image Required", 400));
    }

    const { image } = req.files;
    const allowedTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!allowedTypes.includes(image.mimetype)) {
        return next(new ErrorHandler("Please upload correct image format", 400));
    }

    const { title, description, category, condition, startingBid, startTime, endTime } = req.body;
    if (!title || !description || !category || !condition || !startingBid || !startTime || !endTime) {
        return next(new ErrorHandler("All fields are required", 400));
    }

    if (new Date(startTime) < Date.now()) {
        return next(new ErrorHandler("Start Time should be greater than current time", 400));
    }
    if (new Date(startTime) >= new Date(endTime)) {
        return next(new ErrorHandler("End Time should be greater than Start Time", 400));
    }

    //only one auction can be created by a user at a time
    const alreadyOneAuctionActive = await Auction.find({ createdBy: req.user._id, endTime: { $gte: Date.now() } });
    if (alreadyOneAuctionActive.length > 0) {
        return next(new ErrorHandler("You already have an active auction", 400));
    }

    try {
        const cloudinaryResponse = await cloudinary.uploader.upload(image.tempFilePath, {
            folder: "AUCTIONS",
        });
        if (!cloudinaryResponse || cloudinaryResponse.error) {
            console.error(cloudinaryResponse.error || "Cloudinary error");
            return next(new ErrorHandler("Failed to upload image to cloudinary", 500));
        }

        //create the new auction item
        const auctionItem = await Auction.create({
            title,
            description,
            category,
            condition,
            startingBid,
            startTime,
            endTime,
            image: {
                url: cloudinaryResponse.secure_url,
                public_id: cloudinaryResponse.public_id,
            },
            createdBy: req.user._id
        });
        return res.status(201).json({
            success: true,
            message: `Auction Item created successfully and start on ${startTime} and end on ${endTime}`,
            auctionItem,
        });

    } catch (error) {
        return next(new ErrorHandler(error.message || "Failed to create Auction", 500));


    }


});     

export const getAllItems=catchAsyncErrors(async(req,res,next)=>{});

export const getMyAuctionItems=catchAsyncErrors(async(req,res,next)=>{});

export const getAuctionDetails=catchAsyncErrors(async(req,res,next)=>{});

export const deleteAuctions=catchAsyncErrors(async(req,res,next)=>{});

export const republishItem=catchAsyncErrors(async(req,res,next)=>{});
