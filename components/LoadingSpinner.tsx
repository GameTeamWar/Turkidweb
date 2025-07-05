// components/LoadingSpinner.tsx
export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white opacity-75"></div>
        <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-white opacity-20"></div>
      </div>
    </div>
  );
}