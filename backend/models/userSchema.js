import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        minLength: [3, "Username should be atleast 3 characters long"],
        maxLength: [15, "Username should be atmost 15 characters long"],
        required: true,

    },
    password: {
        type: String,
        selected: false,//this field will not be returned in the response
        minLength: [8, "Password should be atleast 8 characters long"],
        maxLength: [15, "Password should be atmost 15 characters long"],
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone: {
        type: String,
        minLength: [10, "Phone number should be atleast 10 characters long"],
        maxLength: [10, "Phone number should be atmost 10 characters long"],
        required: true,
    },
    profileImage: {
        public_id: { //these will come from cloudinary
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        }
    },
    paymentMethods: {
        bankTransfer: {
            bankAccountNumber: String,
            bankAccountName: String,
            bankName: String,
        },
        paytm: {
            paytmNumber: String,
        },
        paypal: {
            paypalEmail: String,
        },
    },
    role: {
        type: String,
        enum: ["Auctioneer", "Bidder", "Admin"],
    },
    unpaidAmount: {
        type: Number,
        default: 0,
    },
    auctionsWon: {
        type: Number,
        default: 0,
    },
    moneySpent: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJSONWebToken = function (){
    return jwt.sign({id:this._id},process.env.JWT_SECRET_KEY,{
        expiresIn:process.env.JWT_EXPIRE,
    }); 
}

export const User = mongoose.model("User", userSchema); 