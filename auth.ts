import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import postgres from 'postgres';
import bcrypt from 'bcrypt';
import z from 'zod';

import { authConfig } from './auth.config';

import { User } from './app/lib/definitions';

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

async function getUser(email: string): Promise<User | undefined> {
	try {
		const user = await sql<User[]>`
			SELECT *
			FROM users
			WHERE email = ${email};
		`;

		return user.at(0);
	} catch (err) {
		console.error(err);

		throw new Error('Failed to fetch user.');
	}
}

export const { auth, signIn, signOut } = NextAuth({
	...authConfig,
	providers: [Credentials({
		async authorize(credentials) {
			const parsedCredentials = z
				.object({
					email: z.string().email(),
					password: z.string().min(6),
				})
				.safeParse(credentials);

			if (parsedCredentials.success) {
				const { email, password } = parsedCredentials.data;

				const user = await getUser(email);
				if (!user) return null;

				const doPasswordsMatch = await bcrypt.compare(password, user.password);
				if (doPasswordsMatch) return user;
			}

			console.error('Invalid credentials');

			return null;
		},
	})],
});
