import cron from "node-cron";
import { Auction } from "../models/auctionSchema.js";
import { User } from "../models/userSchema.js";
import { Bid } from "../models/bidSchema.js";
import { sendEmail } from "../utils/sendEmail.js";
import { calculateCommission } from "../controllers/commissionController.js";

// This cron job runs every minute to check for ended auctions and process them
//also calculates the commission for the auctioneer and updates the highest bidder's information
// It sends an email to the highest bidder with payment instructions

export const endedAuctionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    console.log("=== CRON JOB RUNNING ===");
    console.log("Current time:", now.toISOString());
    
    // First, let's get all auctions with commissionCalculation = false
      const unprocessedAuctions = await Auction.find({
        commissionCalculation: false
      });
      
      console.log(`Found ${unprocessedAuctions.length} unprocessed auctions`);
      
      // Filter ended auctions manually since MongoDB comparison might not work with string dates
      const endedAuctions = unprocessedAuctions.filter(auction => {
        const auctionEndTime = new Date(auction.endTime);
        const isEnded = auctionEndTime < now;
        
        console.log(`Auction: ${auction.title}`);
        console.log(`  EndTime: ${auction.endTime}`);
        console.log(`  EndTime as Date: ${auctionEndTime.toISOString()}`);
        console.log(`  Current Time: ${now.toISOString()}`);
        console.log(`  Is Ended: ${isEnded}`);
        console.log(`  Time difference: ${now.getTime() - auctionEndTime.getTime()}ms`);
        console.log("---");
        
        return isEnded;
      });
      
      console.log(`Found ${endedAuctions.length} ended auctions to process`);

      if (endedAuctions.length === 0) {
        console.log("No ended auctions to process");
        return;
      }
    for (const auction of endedAuctions) {
      try {
        const commissionAmount = await calculateCommission(auction._id);
        auction.commissionCalculation = true;
        const highestBidder = await Bid.findOne({
          auctionItem: auction._id,
          amount: auction.currentBid,
        });
        const auctioneer = await User.findById(auction.createdBy);
        auctioneer.unpaidAmount = commissionAmount;
        if (highestBidder) {
          auction.highestBidder = highestBidder.bidder.id;
          await auction.save();
          const bidder = await User.findById(highestBidder.bidder.id);
          await User.findByIdAndUpdate(
            bidder._id,
            {
              $inc: {
                moneySpent: highestBidder.amount,
                auctionsWon: 1,
              },
            },
            { new: true }
          );
          await User.findByIdAndUpdate(
            auctioneer._id,
            {
              $inc: {
                unpaidAmount: commissionAmount,
              },
            },
            { new: true }
          );
          //for email to highest bidder
          const subject = `Congratulations! You won the auction for ${auction.title}`;
          const message = `Dear ${bidder.userName}, \n\nCongratulations! You have won the auction for ${auction.title}. \n\nBefore proceeding for payment contact your auctioneer via your auctioneer email:${auctioneer.email} \n\nPlease complete your payment using one of the following methods:\n\n1. **Bank Transfer**: \n- Account Name: ${auctioneer.paymentMethods.bankTransfer.bankAccountName} \n- Account Number: ${auctioneer.paymentMethods.bankTransfer.bankAccountNumber} \n- Bank: ${auctioneer.paymentMethods.bankTransfer.bankName}\n\n2. **Paytm**:\n- You can send payment via Paytm: ${auctioneer.paymentMethods.paytm.paytmNumber}\n\n3. **PayPal**:\n- Send payment to: ${auctioneer.paymentMethods.paypal.paypalEmail}\n\n4. **Cash on Delivery (COD)**:\n- If you prefer COD, you must pay 20% of the total amount upfront before delivery.\n- To pay the 20% upfront, use any of the above methods.\n- The remaining 80% will be paid upon delivery.\n- If you want to see the condition of your auction item then send your email on this: ${auctioneer.email}\n\nPlease ensure your payment is completed by [Payment Due Date]. Once we confirm the payment, the item will be shipped to you.\n\nThank you for participating!\n\nBest regards,\n Auction Team`;
          console.log("SENDING EMAIL TO HIGHEST BIDDER");
          sendEmail({ email: bidder.email, subject, message });
          console.log("SUCCESSFULLY EMAIL SEND TO HIGHEST BIDDER");
        } else {
          await auction.save();
        }
      } catch (error) {
        return next(console.error(error || "Some error in ended auction cron"));
      }
    }
  });
};