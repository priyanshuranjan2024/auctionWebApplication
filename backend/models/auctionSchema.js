import mongoose from "mongoose";

const auctionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    category: String,
    condition:{
        type: String,
        enum: ["New", "Used"],
    },
    startingBid: Number,
    currentBid: {
        type: Number,
        default: 0,
    },
    startTime: String,
    endTime: String,
    image: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        }
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    bids: [{
        userID: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bid",
        },
        userName: String,
        profileImage: String,
        amount: Number,

    }],
    highestBidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    commissionCalculation: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },

});

export const Auction = mongoose.model("Auction", auctionSchema);