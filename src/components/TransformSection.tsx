interface TransformSectionProps {
  transformKey: string;
  transformWidth: string;
  transformHeight: string;
  transformQuality: string;
  transformFormat: string;
  transforming: boolean;
  transformPreview: string | null;
  onKeyChange: (key: string) => void;
  onWidthChange: (width: string) => void;
  onHeightChange: (height: string) => void;
  onQualityChange: (quality: string) => void;
  onFormatChange: (format: string) => void;
  onTransform: () => void;
  onSave: () => void;
}

export function TransformSection({
  transformKey,
  transformWidth,
  transformHeight,
  transformQuality,
  transformFormat,
  transforming,
  transformPreview,
  onKeyChange,
  onWidthChange,
  onHeightChange,
  onQualityChange,
  onFormatChange,
  onTransform,
  onSave,
}: TransformSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
        <svg
          className="w-6 h-6 text-purple-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Transform Image
      </h2>

      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Enter image key"
            value={transformKey}
            onChange={(e) => onKeyChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Width (px)</label>
            <input
              type="number"
              placeholder="e.g. 300"
              value={transformWidth}
              onChange={(e) => onWidthChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Height (px)</label>
            <input
              type="number"
              placeholder="e.g. 300"
              value={transformHeight}
              onChange={(e) => onHeightChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Quality (1-100)</label>
            <input
              type="number"
              placeholder="80"
              min="1"
              max="100"
              value={transformQuality}
              onChange={(e) => onQualityChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Format</label>
            <input
              type="text"
              placeholder="webp, jpg, png"
              value={transformFormat}
              onChange={(e) => onFormatChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
            />
          </div>
        </div>

        <button
          onClick={onTransform}
          disabled={!transformKey || transforming}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {transforming ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Transforming...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Transform
            </>
          )}
        </button>

        {transformPreview && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Transformed image:</p>
              <button
                onClick={onSave}
                className="text-sm bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Save
              </button>
            </div>
            <img
              src={transformPreview}
              alt="Transformed image"
              className="max-w-full h-auto rounded-lg shadow-md mx-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
}
