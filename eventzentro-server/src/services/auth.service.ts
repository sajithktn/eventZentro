import bcrypt from "bcrypt";
import User from "../models/user.models";
import { RegisterInput } from "../validators/auth.validators";
import { error } from "node:console";

export const registerUserService = async (data: RegisterInput) => {
    const existingEmail = await User.findOne({ email: data.email});

    if (existingEmail) {
        throw new Error("Email already exists");
    }

    const existingUserName = await User.findOne({
         username: data.username,
        });

        if (existingUserName) {
            throw new Error("Username already exists")
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);


        const user = await User.create({
            firstName: data.firstName,
            lastName: data.lastName,
            userName: data.username,
            email: data.email,
            phone: data.phone,
            password: hashedPassword,
        });

        return user;
};