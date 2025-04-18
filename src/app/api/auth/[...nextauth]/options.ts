import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GitHubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        identifier: { label: 'Email or Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials: any): Promise<any> {
        await dbConnect();
        try {
          const user = await UserModel.findOne({
            $or: [
              { email: credentials.identifier },
              { username: credentials.identifier },
            ],
          });

          if (!user) {
            throw new Error('No user found with this email or username');
          }

          if (!user.isVerified) {
            throw new Error('Please verify your account before logging in');
          }

          if (!user.password) {
            throw new Error('User does not have a password set');
          }

          const isPasswordCorrect = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordCorrect) {
            throw new Error('Incorrect password');
          }

          return {
            _id: user._id?.toString(),
            email: user.email,
            username: user.username,
            isVerified: user.isVerified,
          };
        } catch (err: any) {
          console.error('Authorize error:', err.message);
          throw new Error('Authentication failed');
        }
      },
    }),

    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name || profile.login,
          email: profile.email || `${profile.login}@github.com`,
          image: profile.avatar_url,
        };
      },
    }),

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
      if (account.provider === 'github' || account.provider === 'google') {
        await dbConnect();
        try {
          let existingUser = await UserModel.findOne({ email: user.email });

          if (!existingUser) {
            if (account.provider === 'google') {
              existingUser = await UserModel.findOne({ googleId: user.id });
            } else if (account.provider === 'github') {
              existingUser = await UserModel.findOne({ githubId: user.id });
            }
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
              ...(account.provider === 'google' && { googleId: user.id }),
              ...(account.provider === 'github' && { githubId: user.id }),
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
          console.error(`${account.provider} sign-in error:`, err.message);
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
