import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth-providers/credentials';
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

        // --- MODIFIED ---
        // Find the user and also get their role
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

        // --- MODIFIED ---
        // Return the user object for the session, including the new role
        return {
          id: user._id,
          username: user.username,
          role: user.role, // <-- Add this
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
        token.role = user.role; // <-- Add this
      }
      return token;
    },
    // Called whenever a session is checked
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role; // <-- Add this
      }
      return session;
    }
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };