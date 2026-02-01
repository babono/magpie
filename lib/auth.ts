import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Mock credentials
const HARDCODED_EMAIL = "demo@magpieiq.com";
const HARDCODED_PASSWORD = "magpieiq";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "your-email@example.com",
                },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const { email, password } = credentials as {
                    email: string;
                    password: string;
                };

                // Check against hardcoded credentials
                if (email === HARDCODED_EMAIL && password === HARDCODED_PASSWORD) {
                    // Return user object on successful authentication
                    return {
                        id: "1",
                        email: HARDCODED_EMAIL,
                        name: "Demo User",
                    };
                }

                // Return null if authentication fails
                throw new Error("Invalid credentials");
            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    secret: process.env.NEXTAUTH_SECRET || "your-secret-key-here",
};

export default NextAuth(authOptions);
