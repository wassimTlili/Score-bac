// /app/layout.jsx
import './globals.css';

export const metadata = {
  title: 'Calculateur Score FG – BAC Tunisie',
  description: 'Calculez votre score FG pour l\'admission universitaire en Tunisie',
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}