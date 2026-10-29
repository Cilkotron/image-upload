import { useState } from "react";
import { UploadSection } from "./components/UploadSection";
import { ViewSection } from "./components/ViewSection";
import { TransformSection } from "./components/TransformSection";

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
    } catch (_err) {
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
    } catch (_err) {
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
    } catch (_err) {
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
    } catch (_err) {
      setError("Failed to transform image");
    } finally {
      setTransforming(false);
    }
  };

  const handleSaveTransformed = () => {
    if (!transformPreview) return;

    const link = document.createElement("a");
    link.href = transformPreview;
    const extension = transformFormat || "jpg";
    link.download = `transformed-${transformKey}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Image Upload Service</h1>
          <p className="text-gray-600">Upload, view, and manage your images with R2 storage</p>
        </div>

        {/* Upload Section */}
        <UploadSection
          selectedFile={selectedFile}
          uploading={uploading}
          uploadResult={uploadResult}
          error={error}
          onFileSelect={handleFileSelect}
          onUpload={handleUpload}
        />

        {/* View Section */}
        <ViewSection
          imageKey={imageKey}
          imagePreview={imagePreview}
          onKeyChange={setImageKey}
          onView={handleViewImage}
          onDelete={handleDeleteImage}
        />

        {/* Transform Section */}
        <TransformSection
          transformKey={transformKey}
          transformWidth={transformWidth}
          transformHeight={transformHeight}
          transformQuality={transformQuality}
          transformFormat={transformFormat}
          transforming={transforming}
          transformPreview={transformPreview}
          onKeyChange={setTransformKey}
          onWidthChange={setTransformWidth}
          onHeightChange={setTransformHeight}
          onQualityChange={setTransformQuality}
          onFormatChange={setTransformFormat}
          onTransform={handleTransformImage}
          onSave={handleSaveTransformed}
        />
      </div>
    </div>
  );
}
