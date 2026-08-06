import mongoose from "mongoose";

import {
    ensurePromotionCouponIndexes,
} from "../models/coupon.model";

const connectDb = async (): Promise<void> => {
    try{
        await mongoose.connect(process.env.MONGODB_URI as string);
        await ensurePromotionCouponIndexes();

        console.log(" MongoDB Connected Successfully");
    } catch (error) {
        console.error(" MongoDB Connection Failed")
        console.error(error);
        process.exit(1);
    }
};

export default connectDb;
