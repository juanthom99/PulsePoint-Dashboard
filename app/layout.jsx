import './globals.css';
import Starfield from '../components/starfield';
export const metadata = { title: 'PulsePoint | Community health', description: 'Explore public health indicators and compare U.S. counties.' };
export default function RootLayout({ children }) {
  return <html lang="en"><body><Starfield>{children}</Starfield></body></html>;
}
