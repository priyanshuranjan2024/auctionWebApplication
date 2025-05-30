import { catchAsyncErrors } from '../middlewares/catchAsyncErrors.js';
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import ErrorHandler from "../middlewares/error.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";


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

export const getAllItems = catchAsyncErrors(async (req, res, next) => {
    let items = await Auction.find();
    res.status(200).json({
        success: true,
        items
    });
});

export const getMyAuctionItems = catchAsyncErrors(async (req, res, next) => {
    let items = await Auction.find({ createdBy: req.user._id });
    res.status(200).json({
        success: true,
        items
    });

});

export const getAuctionDetails = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid Object Id", 400)); //if the id format is not correct
    }
    const auctionItem = await Auction.findById(id);
    if (!auctionItem) {
        return next(new ErrorHandler("Auction Item not found", 404)); //if no auction item found
    }
    //now firstly sort all the bidders in descending order of their bids
    const bidders = auctionItem.bids.sort((a, b) => b.amount - a.amount);
    //now return the auction item with success message
    res.status(200).json({
        success: true,
        auctionItem,
        bidders,
    });

});

export const deleteAuctions = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return next(new ErrorHandler("Invalid Object Id", 400)); //if the id format is not correct
    }
    const auctionItem = await Auction.findById(id);
    if (!auctionItem) {
        return next(new ErrorHandler("Auction Item not found", 404)); //if no auction item found
    }

    //if the auction item is found then delete it
    await auctionItem.deleteOne();
    res.status(200).json({
        success: true,
        message: "Auction Item Deleted Successfully"
    });

});

export const republishItem = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid Id format.", 400));
    }
    let auctionItem = await Auction.findById(id);
    if (!auctionItem) {
      return next(new ErrorHandler("Auction not found.", 404));
    }
    if (!req.body.startTime || !req.body.endTime) {
      return next(
        new ErrorHandler("Starttime and Endtime for republish is mandatory.")
      );
    }
    if (new Date(auctionItem.endTime) > Date.now()) {
      return next(
        new ErrorHandler("Auction is already active, cannot republish", 400)
      );
    }
    let data = {
      startTime: new Date(req.body.startTime),
      endTime: new Date(req.body.endTime),
    };
    if (data.startTime < Date.now()) {
      return next(
        new ErrorHandler(
          "Auction starting time must be greater than present time",
          400
        )
      );
    }
    if (data.startTime >= data.endTime) {
      return next(
        new ErrorHandler(
          "Auction starting time must be less than ending time.",
          400
        )
      );
    }
  
    if (auctionItem.highestBidder) {
      const highestBidder = await User.findById(auctionItem.highestBidder);
      highestBidder.moneySpent -= auctionItem.currentBid;
      highestBidder.auctionsWon -= 1;
      highestBidder.save();
    }
  
    data.bids = [];
    data.commissionCalculation = false;
    data.currentBid = 0;
    data.highestBidder = null;
    auctionItem = await Auction.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    });
    await Bid.deleteMany({ auctionItem: auctionItem._id });
    const createdBy = await User.findByIdAndUpdate(
      req.user._id,
      { unpaidAmount: 0 },
      {
        new: true,
        runValidators: false,
        useFindAndModify: false,
      }
    );
    res.status(200).json({
      success: true,
      auctionItem,
      message: `Auction republished and will be active on ${req.body.startTime}`,
      createdBy,
    });
  });