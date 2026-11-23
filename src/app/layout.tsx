import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Random Football', description: 'Собери свою футбольную команду мечты' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
