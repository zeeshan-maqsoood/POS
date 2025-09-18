export default function LoadingNewMenuItem() {
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      <div className="mb-4">
        <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="mt-1 h-4 w-56 bg-gray-100 rounded animate-pulse" />
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4 sm:p-6 space-y-6">
        {/* Name & Price */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="h-4 w-20 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
          </div>
          <div>
            <div className="h-4 w-16 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Category & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
          </div>
          <div>
            <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
            <div className="h-10 w-full bg-gray-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Description */}
        <div>
          <div className="h-4 w-24 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-24 w-full bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Image uploader */}
        <div>
          <div className="h-4 w-28 bg-gray-200 rounded mb-2 animate-pulse" />
          <div className="h-32 w-full bg-gray-100 rounded animate-pulse" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <div className="h-10 w-24 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
