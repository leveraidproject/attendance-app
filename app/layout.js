import { Figtree } from 'next/font/google';
import './globals.css';
import { COMPANY_NAME } from '@/lib/config';

const figtree = Figtree({ subsets: ['latin'] });

export const metadata = {
  title: `${COMPANY_NAME} Attendance`,
  description: 'Time in and time out for employees.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={figtree.className}>{children}</body>
    </html>
  );
}
