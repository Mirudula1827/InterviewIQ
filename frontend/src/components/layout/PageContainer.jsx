export default function PageContainer({ children }) {
  return (
    <main className="flex-1 overflow-y-auto p-5 sm:p-7 lg:p-8 animate-fade-in">
      <div className="mx-auto max-w-6xl">
        {children}
      </div>
    </main>
  )
}
