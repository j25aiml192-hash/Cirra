export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body className="bg-gray-950 min-h-screen">
        {children}
      </body>
    </html>
  );
}
