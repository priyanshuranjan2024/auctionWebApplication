import {addNewAuctionItem,getAllItems,getMyAuctionItems,getAuctionDetails,deleteAuctions,republishItem} from "../controllers/auctionItemController.js";
import {isAuthenticated,isAuthorized} from "../middlewares/auth.js";
import express from "express";
import { trackCommissionStatus } from "../middlewares/trackCommissionStatus.js";


const router = express.Router();

router.post("/create",isAuthenticated,isAuthorized("Auctioneer"),trackCommissionStatus,addNewAuctionItem);
router.get("/allitems",getAllItems);
router.get("/myitems",isAuthenticated,isAuthorized("Auctioneer"),getMyAuctionItems);
router.get("/auction/:id",isAuthenticated,getAuctionDetails);
router.delete("/delete/:id",isAuthenticated,isAuthorized("Auctioneer"),deleteAuctions);
router.put("/item/republish/:id",isAuthenticated,isAuthorized("Auctioneer"),republishItem);



export default router;
