//this is for the automation for removing the unpaid commissions after 
//super admin approves the commission
//here only those payments will come that are approved by the super admin
import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema({
  amount: Number,
  user: mongoose.Schema.Types.ObjectId,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Commission = mongoose.model("Commission", commissionSchema);