import mongoose, {Schema} from "mongoose";

import { IUser, UserRole } from "../interfaces/user.interface";





const userSchema = new Schema<IUser>(

    {

        firstName: {

            type: String,

            required: true,

            trim: true,

        },



        lastName: {

            type: String,

            required: true,

            trim: true,

        },



        userName: {

            type: String,

            required: true,

            unique: true,

            trim: true,

            lowercase: true,

        },



        email: {

            type: String,

            required: true,

            unique: true,

            lowercase: true,

            trim: true,

        },



        phone: {

            type: String,

            required: true,

            unique: true,

            trim: true,

        },



        password: {

            type: String,

            required: true,

            minlength: 6,

            select: false,

        },



        profileImage: {

            type: String,

            default: "",

        },



        bio: {

            type: String,

            default: "",

        },



        role: {

            type: String,

            enum: Object.values(UserRole),

            default: UserRole.USER,

        },



        isVerified: {

            type: Boolean,

            default: false,

        },



        verificationOTP: String,



        verificationOTPExpiry: Date,



        refreshToken: String,



        passwordChangedAt: Date,



        isBlocked: {

            type: Boolean,

            default: false,

        },



        isDeleted: {

            type: Boolean,

            default: false,

        },



        lastLogin: Date,



        googleId: String,

        githubId: String,



        address: {

            country: String,

            state: String,

            city: String,

            zipCode: String,

        },



        favoriteCategories: [

            {

                type: String,

            },

        ],



        interestedEvents: [

            {

                type: String,

            },

        ],

    },

    {

        timestamps: true,

    }

);



const User = mongoose.model<IUser>("User", userSchema);



export default User;