import mongoose from "mongoose";

export const connection=async()=>{
    mongoose.connect(process.env.MONGO_URI,{
        dbName:"MERN_AUCTION_PLATFORM",
    }).then(()=>{
        console.log('Database connected');
    }).catch((err)=>{
        console.log(`Error connecting to database: ${err}`);
    });
}