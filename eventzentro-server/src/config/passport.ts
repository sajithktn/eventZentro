import passport from "passport"
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import "dotenv/config"
import User from "../models/user.models";
import { AuthProvider } from "../interfaces/user.interface";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: process.env.GOOGLE_CALLBACK_URL!,
        },
        async (
            accessToken: string,
            refreshToken: string,
            profile: Profile,
            done
        ) => {
            try {
                const email = profile.emails?.[0]?.value;

                if (!email) {
                    return done(new Error("Google account has no email"), false);
                }

                let user = await User.findOne({
                    googleId: profile.id,
                });

                if (user) {
                    return done(null, user);
                }

                user = await User.findOne({
                    email,
                });

                if (user) {
                    user.googleId = profile.id;
                    user.provider = AuthProvider.GOOGLE;
                    user.isVerified = true;

                    await user.save();

                    return done(null, user);
                }

                user = await User.create({
                    firstName: profile.name?.givenName || "",
                    lastName: profile.name?.familyName || "",
                    email,
                    googleId: profile.id,
                    provider: AuthProvider.GOOGLE,
                    isVerified: true,
                    profileImage: profile.photos?.[0]?.value || "",
                    lastLogin: new Date(),
                });

                return done(null, user);
            } catch (error) {
                return done(error as Error, false);
            }
        }
    )
);

export default passport;