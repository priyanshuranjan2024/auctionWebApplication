import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/error.js";
import { Auction } from "../models/auctionSchema.js";
import { Bid } from "../models/bidSchema.js";
import { User } from "../models/userSchema.js";

export const placeBid = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const auctionItem = await Auction.findById(id);
    if (!auctionItem) {
        return next(new ErrorHandler('Auction not found', 404));
    }

    const { amount } = req.body; //bid placed by user in the frontend

    if (!amount) {
        return next(new ErrorHandler('Please place your bid', 404));
    }
    if (amount < auctionItem.currentBid) {
        return next(new ErrorHandler('Bid amount must be higher than the current bid', 404));
    }
    if (amount < auctionItem.startingBid) {
        return next(new ErrorHandler('Bid amount must be higher than the starting bid', 404));
    }

    try {
        const existingBid = await Bid.findOne({ //this is the last bid placed by other bidder
            "bidder.id": req.user._id,
            auctionItem: auctionItem._id
        });

        const existingBidInAuction = auctionItem.bids.find(
            (bid) => bid._id.toString() == req.user._id.toString() //check if the user has already placed a bid in the auction by searching the bid array
        );

        if (existingBid && existingBidInAuction) { //if user has already placed a bid in the auction just update the new amount
            existingBidInAuction.amount = amount;
            existingBid.amount = amount;
            await existingBidInAuction.save();
            await existingBid.save();
            auctionItem.currentBid = amount;
        } else { //otherwise create a new bid and puch it in the array of bids and update the current bid
            const bidderDetail = await User.findById(req.user._id);
            const bid = await Bid.create({
                amount,
                bidder: {
                    id: bidderDetail._id,
                    userName: bidderDetail.userName,
                    profileImage: bidderDetail.profileImage?.url,
                },
                auctionItem: auctionItem._id,
            });
            auctionItem.bids.push({ //push into the array of bids
                userId: req.user._id,
                userName: bidderDetail.userName,
                profileImage: bidderDetail.profileImage?.url,
                amount,
            });
            auctionItem.currentBid = amount;
        }

        await auctionItem.save();

        res.status(200).json({
            success: true,
            message: 'Bid placed successfully',
            currentBid: auctionItem.currentBid,
        });


    } catch (error) {
        return next(new ErrorHandler(error.message || "Internal Server Error", 500));
    }


})