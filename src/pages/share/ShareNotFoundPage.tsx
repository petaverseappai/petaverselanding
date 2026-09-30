export function ShareNotFoundPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <p className="text-lg text-gray-600 mb-6">Post not found</p>
        <p className="text-gray-500 mb-8">This post may have been deleted or doesn&apos;t exist.</p>
        <div className="space-y-3">
          <a
            href="https://petaverseapp.com"
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Download PetaVerse
          </a>
          <p className="text-gray-500">or</p>
          <a href="/" className="text-blue-600 hover:underline">
            Go to home
          </a>
        </div>
      </div>
    </div>
  );
}
