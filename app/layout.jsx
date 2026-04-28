export const metadata = {
  title: "Suivi de change EUR",
  description: "Taux de change Euro vers Roupie indonésienne et Ringgit malaisien",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0d1117" />
      </head>
      <body style={{ margin: 0, background: "#0d1117" }}>{children}</body>
    </html>
  );
}
