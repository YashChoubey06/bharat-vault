import "@/styles/utilities.css";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Bharat Vault | Land Record Intelligence",
  description:
    "Evidence-driven land record intelligence and verification platform.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
