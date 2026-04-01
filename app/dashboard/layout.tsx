import SideNav from '@/app/ui/dashboard/sidenav';

export default function Layout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<SideNav />

			{children}
		</>
	);
}
