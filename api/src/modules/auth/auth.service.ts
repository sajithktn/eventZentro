import bcrypt from "bcrypt";
import User from "../user/user.model";
import { RegisterInput, LoginInput } from "./auth.validation";
import * as jwt from "jsonwebtoken";

import { generateOTP } from "../../utils/generateOTP";
import { saveOTP } from "../../utils/redisOTP";
import { sendEmail } from "../../config/sendEmail";
import { verificationOTPTemplate } from "../../templates/verificationOTP";
import { VerifyEmailInput } from "./auth.validation";
import { getOTP, deleteOTP } from "../../utils/redisOTP";
import {
  ForgotPasswordInput,
  ResetPasswordInput,
  ResendOTPInput,
} from "./auth.validation";


export const registerUserService = async (data: RegisterInput) => {
    const normalizedEmail = data.email.toLowerCase().trim();

    const existingUser = await User.findOne({
        email: normalizedEmail,
    });

    if (existingUser) {
        if (existingUser.isVerified) {
            throw new Error("Email already exists");
        }

        // Account was created previously but never verified: update credentials and send fresh OTP
        const hashedPassword = await bcrypt.hash(data.password, 10);
        existingUser.firstName = data.firstName;
        existingUser.lastName = data.lastName;
        existingUser.password = hashedPassword;
        await existingUser.save();

        const otp = generateOTP();
        await saveOTP(existingUser.email, otp);

        await sendEmail({
            to: existingUser.email,
            subject: "Verify Your EventZentro Account",
            htmlContent: verificationOTPTemplate(
                existingUser.firstName,
                otp,
                "verify"
            ),
            otp,
        });

        return {
            user: existingUser,
            message: "Registration successful. Please verify your email.",
        };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
        firstName: data.firstName,
        lastName: data.lastName,
        email: normalizedEmail,
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
        otp,
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
    otp,
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
  user.isVerified = true;

  await user.save();

  await deleteOTP(data.email);

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
    success: true,
    message: "Password reset successfully.",
    user: userWithoutPassword,
    token,
  };
};



export const loginUserService = async (data: LoginInput) => {
  const user = await User.findOne({
    email: data.email.toLowerCase(),
  }).select("+password");

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.isBlocked) {
    throw new Error("Your account has been blocked. Please contact support.");
  }

  if (user.isDeleted) {
    throw new Error("This account is no longer active.");
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
    otp,
  });

  return {
    success: true,
    message: "A new OTP has been sent.",
  };
};
