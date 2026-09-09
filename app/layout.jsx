import './globals.css';
import Starfield from '../components/starfield';
export const metadata = { title: 'PulsePoint | Interactive community health atlas', description: 'Move across an immersive U.S. county map to explore and compare community health indicators.' };
export default function RootLayout({ children }) {
  return <html lang="en"><body><Starfield>{children}</Starfield></body></html>;
}
