import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      profile(profile) {
        return {
          id: profile.id || `${profile.email}-${Date.now()}`,
          name: profile.name || `${profile.given_name} ${profile.family_name}` || 'Anonymous User',
          email: profile.email || `${profile.id}@example.com`,
          image: profile.picture || '',
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }: { user: any; account: any }) {
      if (account.provider === 'google') {
        await dbConnect();
        try {
          let existingUser = await UserModel.findOne({ email: user.email });

          if (!existingUser) {
            existingUser = await UserModel.findOne({ googleId: user.id });
          }

          if (!existingUser) {
            const baseUsername = user.email?.split('@')[0] || user.name?.replace(/\s+/g, '') || `user${Date.now()}`;
            const existingUsername = await UserModel.findOne({ username: baseUsername });

            const username = existingUsername
              ? `${baseUsername}-${Date.now()}`
              : baseUsername;

            const newUser = new UserModel({
              email: user.email,
              username,
              isVerified: true,
              googleId: user.id,
            });
            await newUser.save();

            user.username = username;
            user._id = newUser._id?.toString();
          } else {
            if (!existingUser.isVerified) {
              throw new Error('Please verify your account before logging in');
            }

            user.username = existingUser.username;
            user._id = existingUser._id?.toString();
          }

          return true;
        } catch (err: any) {
          console.error(`Google sign-in error:`, err.message);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token._id = user._id;
        token.isVerified = user.isVerified;
        token.username = user.username;
      }
      return token;
    },

    async session({ session, token }: { session: any; token: any }) {
      if (token) {
        session.user = {
          _id: token._id,
          email: token.email,
          username: token.username,
          isVerified: token.isVerified,
        };
      }
      return session;
    },
  },
};
