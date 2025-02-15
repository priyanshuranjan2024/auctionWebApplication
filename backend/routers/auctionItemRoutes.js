import {addNewAuctionItem,getAllItems,getMyAuctionItems,getAuctionDetails,deleteAuctions,republishItem} from "../controllers/auctionItemController.js";
import {isAuthenticated,isAutherized} from "../middlewares/auth.js";
import express from "express";
import { trackCommissionStatus } from "../middlewares/trackCommissionStatus.js";


const router = express.Router();

router.post("/create",isAuthenticated,isAutherized("Auctioneer"),trackCommissionStatus,addNewAuctionItem);
router.get("/allitems",getAllItems);
router.get("/myitems",isAuthenticated,isAutherized("Auctioneer"),getMyAuctionItems);
router.get("/auction/:id",isAuthenticated,getAuctionDetails);
router.delete("/delete/:id",isAuthenticated,isAutherized("Auctioneer"),deleteAuctions);
router.put("/item/republish/:id",isAuthenticated,isAutherized("Auctioneer"),republishItem);



export default router;
