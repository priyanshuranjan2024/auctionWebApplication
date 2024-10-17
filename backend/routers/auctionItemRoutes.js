import {addNewAuctionItem,getAllItems,getMyAuctionItems,getAuctionDetails,deleteAuctions,republishItem} from "../controllers/auctionItemController.js";
import {isAuthenticated,isAutherized} from "../middlewares/auth.js";
import express from "express";


const router = express.Router();

router.post("/create",isAuthenticated,isAutherized("Auctioneer"),addNewAuctionItem);
router.get("/allitems",getAllItems);
router.get("/auction/:id",isAuthenticated,getAuctionDetails);



export default router;
