import { Montserrat } from 'next/font/google';
import './globals.css';
import { COMPANY_NAME } from '@/lib/config';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: `${COMPANY_NAME} Attendance`,
  description: 'Time in and time out for employees.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>{children}</body>
    </html>
  );
}
