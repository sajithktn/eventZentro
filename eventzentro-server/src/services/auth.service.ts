import bcrypt from "bcrypt";
import User from "../models/user.models";
import { RegisterInput, LoginInput } from "../validators/auth.validators";
import * as jwt from "jsonwebtoken";

import { generateOTP } from "../utils/generateOTP";
import { saveOTP } from "../utils/redisOTP";
import { sendEmail } from "../config/sendEmail";
import { verificationOTPTemplate } from "../templates/verificationOTP";
import { VerifyEmailInput } from "../validators/auth.validators";
import { getOTP, deleteOTP } from "../utils/redisOTP";
import {
  ForgotPasswordInput,
  ResetPasswordInput,
  ResendOTPInput,
} from "../validators/auth.validators";


export const registerUserService = async (data: RegisterInput) => {
    const existingEmail = await User.findOne({
        email: data.email,
    });

    if (existingEmail) {
        throw new Error("Email already exists");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        isVerified: false,
    });

    const otp = generateOTP();

    await saveOTP(user.email, otp);


    await sendEmail({
        to: user.email,
        subject: "Verify Your EventZentro Account",
        htmlContent: verificationOTPTemplate(
            user.firstName,
            otp,
            "verify"
        ),
    });


    return {
        user,
        message: "Registration successful. Please verify your email.",
    };
};


export const verifyEmailService = async (
    data: VerifyEmailInput
) => {
    const user = await User.findOne({
        email: data.email,
    });

    if (!user) {
        throw new Error("User not found");
    }

    if (user.isVerified) {
        throw new Error("Email is already verified");
    }

    const storedOTP = await getOTP(data.email);

    if (!storedOTP) {
        throw new Error("OTP has expired or is invalid");
    }

    if (storedOTP !== data.otp) {
        throw new Error("Invalid OTP");
    }

    user.isVerified = true;

    await user.save();

    await deleteOTP(data.email);

    return {
        success: true,
        message: "Email verified successfully.",
    };
};


export const forgotPasswordService = async (
  data: ForgotPasswordInput
) => {
  const user = await User.findOne({
    email: data.email,
  });

  if (!user) {
    throw new Error("User not found");
  }

  const otp = generateOTP();

  await saveOTP(user.email, otp);

  await sendEmail({
    to: user.email,
    subject: "Reset Your EventZentro Password",
    htmlContent: verificationOTPTemplate(
      user.firstName,
      otp,
      "reset"
    ),
  });

  return {
    success: true,
    message: "Password reset OTP sent successfully.",
  };
};



export const resetPasswordService = async (
  data: ResetPasswordInput
) => {
  const user = await User.findOne({
    email: data.email.toLowerCase(),
  });

  if (!user) {
    throw new Error("User not found");
  }

  const storedOTP = await getOTP(data.email);

  if (!storedOTP) {
    throw new Error("OTP has expired or is invalid");
  }

  if (storedOTP !== data.otp) {
    throw new Error("Invalid OTP");
  }

  const hashedPassword = await bcrypt.hash(
    data.password,
    10
  );

  user.password = hashedPassword;

  await user.save();

  await deleteOTP(data.email);

  return {
    success: true,
    message: "Password reset successfully.",
  };
};



export const loginUserService = async (data: LoginInput) => {
  const user = await User.findOne({
    email: data.email.toLowerCase(),
  }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (!user.isVerified) {
    throw new Error("Please verify your email before logging in.");
  }

  if (!user.password) {
    throw new Error(
      "This account was created using Google. Please continue with Google."
    );
  }

  const isPasswordMatch = await bcrypt.compare(
    data.password,
    user.password
  );

  if (!isPasswordMatch) {
    throw new Error("Invalid email or password");
  }

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET_KEY as string,
    {
      expiresIn: "7d",
    }
  );

  const userObject = user.toObject();

  const { password, ...userWithoutPassword } = userObject;

  return {
    user: userWithoutPassword,
    token,
  };
};

export const resendOTPService = async (
  data: ResendOTPInput
) => {
  const user = await User.findOne({
    email: data.email.toLowerCase(),
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.isVerified) {
    throw new Error("Email is already verified");
  }

  const otp = generateOTP();

  await saveOTP(user.email, otp);

  await sendEmail({
    to: user.email,
    subject: "Verify Your EventZentro Account",
    htmlContent: verificationOTPTemplate(
      user.firstName,
      otp,
      "verify"
    ),
  });

  return {
    success: true,
    message: "A new OTP has been sent.",
  };
};
