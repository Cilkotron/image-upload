import { useState } from "react";

export default function App() {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState(false);
	const [uploadResult, setUploadResult] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);
	const [imageKey, setImageKey] = useState<string>("");
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [transformKey, setTransformKey] = useState<string>("");
	const [transformWidth, setTransformWidth] = useState<string>("");
	const [transformHeight, setTransformHeight] = useState<string>("");
	const [transformQuality, setTransformQuality] = useState<string>("");
	const [transformFormat, setTransformFormat] = useState<string>("");
	const [transforming, setTransforming] = useState(false);
	const [transformPreview, setTransformPreview] = useState<string | null>(null);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && file.type.startsWith("image/")) {
			setSelectedFile(file);
			setError(null);
			setUploadResult(null);
		} else {
			setError("Please select an image file");
		}
	};

	const handleUpload = async () => {
		if (!selectedFile) return;

		setUploading(true);
		setError(null);
		setUploadResult(null);

		try {
			const response = await fetch("/images", {
				method: "POST",
				body: selectedFile,
				headers: {
					"Content-Type": selectedFile.type,
				},
			});

			const data = await response.json();

			if (response.ok) {
				setUploadResult(data);
				setImageKey(data.key);
				setTransformKey(data.key);
			} else {
				setError(data.message || "Upload failed");
			}
		} catch (err) {
			setError("Failed to upload image");
		} finally {
			setUploading(false);
		}
	};

	const handleViewImage = async () => {
		if (!imageKey) return;

		try {
			const response = await fetch(`/images/${imageKey}`);
			if (response.ok) {
				const blob = await response.blob();
				const imageUrl = URL.createObjectURL(blob);
				setImagePreview(imageUrl);
			} else {
				setError("Image not found");
			}
		} catch (err) {
			setError("Failed to retrieve image");
		}
	};

	const handleDeleteImage = async () => {
		if (!imageKey) return;

		if (!confirm("Are you sure you want to delete this image?")) {
			return;
		}

		try {
			const response = await fetch(`/images/${imageKey}`, {
				method: "DELETE",
			});
			const data = await response.json();
			setUploadResult(data);
			setImageKey("");
			setImagePreview(null);
		} catch (err) {
			setError("Failed to delete image");
		}
	};

	const handleTransformImage = async () => {
		if (!transformKey) return;

		setTransforming(true);
		setError(null);
		setTransformPreview(null);

		try {
			const params = new URLSearchParams();
			if (transformWidth) params.append("width", transformWidth);
			if (transformHeight) params.append("height", transformHeight);
			if (transformQuality) params.append("quality", transformQuality);
			if (transformFormat) params.append("format", transformFormat);

			const response = await fetch(`/images/${transformKey}/transform?${params.toString()}`);

			if (response.ok) {
				const blob = await response.blob();
				const imageUrl = URL.createObjectURL(blob);
				setTransformPreview(imageUrl);
			} else {
				const errorText = await response.text();
				setError(errorText || "Image transformation failed");
			}
		} catch (err) {
			setError("Failed to transform image");
		} finally {
			setTransforming(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
			<div className="max-w-3xl mx-auto">
				<div className="text-center mb-10">
					<h1 className="text-4xl font-bold text-gray-800 mb-2">
						Image Upload Service
					</h1>
					<p className="text-gray-600">
						Upload, view, and manage your images with R2 storage
					</p>
				</div>

				{/* Upload Section */}
				<div className="bg-white rounded-xl shadow-lg p-8 mb-8">
					<h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
						<svg
							className="w-6 h-6 text-blue-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
						Upload Image
					</h2>

					<div className="space-y-4">
						<div className="relative">
							<input
								type="file"
								accept="image/*"
								onChange={handleFileSelect}
								className="block w-full text-sm text-gray-500
									file:mr-4 file:py-2 file:px-4
									file:rounded-lg file:border-0
									file:text-sm file:font-semibold
									file:bg-blue-50 file:text-blue-700
									hover:file:bg-blue-100
									cursor-pointer"
							/>
						</div>

						<button
							onClick={handleUpload}
							disabled={!selectedFile || uploading}
							className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
						>
							{uploading ? (
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
									Uploading...
								</>
							) : (
								<>
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
										/>
									</svg>
									Upload
								</>
							)}
						</button>

						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
								<svg
									className="w-5 h-5 text-red-500"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								{error}
							</div>
						)}

						{uploadResult && (
							<div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
								<p className="font-medium mb-2">Upload successful!</p>
								<pre className="text-xs overflow-x-auto">
									{JSON.stringify(uploadResult, null, 2)}
								</pre>
							</div>
						)}
					</div>
				</div>

				{/* View Section */}
				<div className="bg-white rounded-xl shadow-lg p-8">
					<h2 className="text-2xl font-semibold text-gray-700 mb-6 flex items-center gap-2">
						<svg
							className="w-6 h-6 text-indigo-500"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
							/>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
							/>
						</svg>
						View Image
					</h2>

					<div className="space-y-4">
						<div className="flex gap-3">
							<input
								type="text"
								placeholder="Enter image key"
								value={imageKey}
								onChange={(e) => setImageKey(e.target.value)}
								className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
							/>
							<button
								onClick={handleViewImage}
								className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
								View
							</button>
							<button
								onClick={handleDeleteImage}
								className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
									/>
								</svg>
								Delete
							</button>
						</div>

						{imagePreview && (
							<div className="mt-6 p-4 bg-gray-50 rounded-lg">
								<img
									src={imagePreview}
									alt="Uploaded image"
									className="max-w-full h-auto rounded-lg shadow-md mx-auto"
								/>
							</div>
						)}
					</div>
				</div>

				{/* Transform Section */}
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
								onChange={(e) => setTransformKey(e.target.value)}
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
									onChange={(e) => setTransformWidth(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-600 mb-1">Height (px)</label>
								<input
									type="number"
									placeholder="e.g. 300"
									value={transformHeight}
									onChange={(e) => setTransformHeight(e.target.value)}
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
									onChange={(e) => setTransformQuality(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-600 mb-1">Format</label>
								<input
									type="text"
									placeholder="webp, jpg, png"
									value={transformFormat}
									onChange={(e) => setTransformFormat(e.target.value)}
									className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
								/>
							</div>
						</div>

						<button
							onClick={handleTransformImage}
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
									<svg
										className="w-5 h-5"
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
									Transform
								</>
							)}
						</button>

						{transformPreview && (
							<div className="mt-6 p-4 bg-gray-50 rounded-lg">
								<p className="text-sm text-gray-600 mb-2">Transformed image:</p>
								<img
									src={transformPreview}
									alt="Transformed image"
									className="max-w-full h-auto rounded-lg shadow-md mx-auto"
								/>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
