import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { fetchCustomerById, fetchCustomers, fetchInvoiceById } from '@/app/lib/data';

import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import Form from '@/app/ui/invoices/edit-form';

import { formatDateToLocal } from '@/app/lib/utils';

export async function generateMetadata(
	{ params }: { params: Promise<{ id: string }> },
): Promise<Metadata> {
	const { id } = await params;

	const invoice = await fetchInvoiceById(id);
	const customer = await fetchCustomerById(invoice.customer_id);

	const localInvoiceDate = formatDateToLocal(invoice.date);

	return {
		title: `Edit Invoice for ${customer.name} on ${localInvoiceDate}`,
	};
}

export default async function Page(props: {
	params: Promise<{ id: string }>,
}) {
	const params = await props.params;
	const id = params.id;

	const [invoice, customers] = await Promise.all([
		fetchInvoiceById(id),
		fetchCustomers(),
	]);

	if (!invoice) notFound();

	return (
		<main>
			<Breadcrumbs
				breadcrumbs={[
					{ label: 'Invoices', href: '/dashboard/invoices' },
					{
						label: 'Edit Invoice',
						href: `/dashboard/invoices/${id}/edit`,
						active: true,
					},
				]}
			/>

			<Form invoice={invoice} customers={customers} />
		</main>
	);
}
