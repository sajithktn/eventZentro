import redisClient from "../config/redis";

const OTP_EXPIRY = 10 * 60; 

const getOTPKey = (email: string) => `otp:${email.toLowerCase()}`;

export const saveOTP = async (email: string, otp: string): Promise<void> => {
    await redisClient.set(
        getOTPKey(email),
        otp,
        {
            EX: OTP_EXPIRY,
        }
    );
};

export const getOTP = async (email: string): Promise<string | null> => {
    return await redisClient.get(getOTPKey(email));
};

export const deleteOTP = async (email: string): Promise<void> => {
    await redisClient.del(getOTPKey(email));
};