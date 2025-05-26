import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { PaymentProof } from "../models/commissionProofSchema.js";
import { User } from "../models/userSchema.js";
import { Auction } from "../models/auctionSchema.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

export const proofOfCommission = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return next(new ErrorHandler("Payment Proof Screenshot required.", 400));
  }
  const { proof } = req.files;
  const { amount, comment } = req.body;
  //get the user from the request
  const user = await User.findById(req.user._id);

  if (!amount || !comment) { //validate amount and comment
    return next(
      new ErrorHandler("Ammount & comment are required fields.", 400) //400 is Bad Request
    );
  }

  if (user.unpaidAmount === 0) { //if user has no unpaid commission and tries to submit proof
    return res.status(200).json({ //200 is OK just for remembering :)
      success: true,
      message: "You don't have any unpaid commissions.",
    });
  }

  //if user tries to pay more than his unpaid commission
  if (user.unpaidAmount < amount) {
    return next(
      new ErrorHandler(
        `The amount exceeds your unpaid commission balance. Please enter an amount up to ${user.unpaidAmount}`,
        403
      ) //403 is Forbidden
    );
  }

  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(proof.mimetype)) {
    return next(new ErrorHandler("ScreenShot format not supported.", 400));
  }

  const cloudinaryResponse = await cloudinary.uploader.upload(
    proof.tempFilePath,
    {
      folder: "MERN_AUCTION_PAYMENT_PROOFS",
    }
  );
  if (!cloudinaryResponse || cloudinaryResponse.error) {
    console.error(
      "Cloudinary error:",
      cloudinaryResponse.error || "Unknown cloudinary error."
    );
    return next(new ErrorHandler("Failed to upload payment proof.", 500));
  }

  //for the model
  const commissionProof = await PaymentProof.create({
    userId: req.user._id,
    proof: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
    amount,
    comment,
  });

  //send the response
  res.status(201).json({
    success: true,
    message:
      "Your proof has been submitted successfully. We will review it and responed to you within 24 hours.",
    commissionProof,
  });
});