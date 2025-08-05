export const LoadingSpinner = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <div className="text-white text-xl">{message}</div>
      </div>
    </div>
  );
}; 