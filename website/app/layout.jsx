export default function RootLayout({ children }) {
  return (
    <div className="h-screen w-full">
      <main className="h-full w-full">
        {children}
      </main>
    </div>
  );
}
