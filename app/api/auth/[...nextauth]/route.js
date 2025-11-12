import NextAuth from 'next-auth';
// --- THIS IS THE FIX ---
// The path should be 'next-auth/providers/credentials'
import CredentialsProvider from 'next-auth/providers/credentials';
// --- END FIX ---

import dbConnect from '@/app/lib/mongodb'; 
import User from '@/app/models/User'; 
import bcrypt from 'bcrypt';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      
      async authorize(credentials) {
        await dbConnect();

        const user = await User.findOne({ username: credentials.username });
        if (!user) {
          throw new Error('No user found with this username.');
        }

        const isPasswordCorrect = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordCorrect) {
          throw new Error('Incorrect password.');
        }

        // Return user object for the session
        return {
          id: user._id,
          username: user.username,
          role: user.role, // Include the role
        };
      }
    })
  ],
  
  session: {
    strategy: 'jwt',
  },
  
  callbacks: {
    // Called whenever a JWT is created
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role; // Add role to token
      }
      return token;
    },
    // Called whenever a session is checked
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role; // Add role to session
      }
      return session;
    }
  },

  pages: {
    signIn: '/login', 
  },

  secret: process.env.NEXTAUTH_SECRET,
};

// In the App Router, we export GET and POST handlers
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };