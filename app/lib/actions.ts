'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import postgres from 'postgres';

export type State = {
	errors?: {
		customerId?: string[],
		amount?: string[],
		status?: string[],
	},
	message?: string | null,
};

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

const FormSchema = z.object({
	id: z.string(),
	customerId: z.string({
		invalid_type_error: 'Please select a customer.',
	}),
	amount: z.coerce
		.number()
		.gt(0, { message: 'Please enter an amount greater than $0.' }),
	status: z.enum(['pending', 'paid'], {
		invalid_type_error: 'Please select an invoice status',
	}),
	date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
	const validatedFields = CreateInvoice.safeParse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	});

	if (validatedFields.error) {
		return {
			errors: validatedFields.error.flatten().fieldErrors,
			message: 'Missing fields. Failed to create invoice.',
		}
	}

	const { customerId, amount, status } = validatedFields.data;
	const amountInCents = amount * 100;
	const date = new Date().toISOString().split('T')[0];

	try {
		await sql`
			INSERT INTO invoices (customer_id, amount, status, date)
			VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
		`;
	} catch (err) {
		console.error(err);

		return { message: 'Database Error: Failed to create invoice.' };
	}

	revalidatePath('/dashboard/invoices');
	redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
	const { customerId, amount, status } = UpdateInvoice.parse({
		customerId: formData.get('customerId'),
		amount: formData.get('amount'),
		status: formData.get('status'),
	});

	const amountInCents = amount * 100;

	try {
		await sql`
			UPDATE invoices
			SET
				customer_id = ${customerId},
				amount = ${amountInCents},
				status = ${status}
			WHERE id = ${id};
		`;
	} catch (err) {
		console.error(err);

		return { message: 'Database Error: Failed to update invoice.' };
	}

	revalidatePath('/dashboard/invoices');
	redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
	try {
		await sql`
			DELETE FROM invoices
			WHERE id = ${id};
		`;
	} catch (err) {
		console.error(err);

		return { message: 'Database Error: Failed to delete invoice.' };
	}

	revalidatePath('/dashboard/invoices');
}
