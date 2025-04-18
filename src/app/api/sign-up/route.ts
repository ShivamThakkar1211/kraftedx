import dbConnect from '@/lib/dbConnect';
import UserModel from '@/model/User';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/helpers/sendVerificationEmail';

interface RequestBody {
  username: string;
  email: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    await dbConnect();

    // Type assertion to assert the shape of the incoming data
    const { username, email, password }: RequestBody = await request.json() as RequestBody;

    const existingVerifiedUserByUsername = await UserModel.findOne({
      username,
      isVerified: true,
    });

    if (existingVerifiedUserByUsername) {
      return new Response('Username is already taken', { status: 400 });
    }

    const existingUserByEmail = await UserModel.findOne({ email });
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    if (existingUserByEmail) {
      if (existingUserByEmail.isVerified) {
        return new Response('User already exists with this email', { status: 400 });
      }

      existingUserByEmail.password = await bcrypt.hash(password, 10);
      existingUserByEmail.verifyCode = verifyCode;
      existingUserByEmail.verifyCodeExpiry = new Date(Date.now() + 3600000);

      try {
        await existingUserByEmail.save();
      } catch (err) {
        console.error('Error updating existing user:', err);
        return new Response('Error registering user', { status: 500 });
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const expiryDate = new Date(Date.now() + 3600000); // 1 hour from now

      const newUser = new UserModel({
        username,
        email,
        password: hashedPassword,
        verifyCode,
        verifyCodeExpiry: expiryDate,
        isVerified: false,
        isAcceptingMessages: true,
        messages: [],
      });

      try {
        await newUser.save();
      } catch (err) {
        console.error('Error saving new user:', err);
        return new Response('Error registering user', { status: 500 });
      }
    }

    const emailResponse = await sendVerificationEmail(
      email,
      username,
      verifyCode
    );

    if (!emailResponse.success) {
      console.error('Error sending verification email:', emailResponse.message);
      return new Response('Error sending verification email', { status: 500 });
    }

    return new Response(
      'User registered successfully. Please verify your account.',
      { status: 201 }
    );
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response('Error registering user', { status: 500 });
  }
}
