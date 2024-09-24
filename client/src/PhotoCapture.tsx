import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  Camera,
  Upload,
  X,
  Check,
  Loader,
  ThumbsUp,
  ThumbsDown,
  Save,
} from 'lucide-react';

interface Nutrition {
  calories: number;
  fat: number;
  saturatedFat: number;
  carbohydrate: number;
  sugar: number;
  dietaryFiber: number;
  protein: number;
  cholesterol: number;
  sodium: number;
}

interface Results {
  nutrition: Nutrition;
}

const PhotoCapture: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedResults, setEditedResults] = useState<Results | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setCapturedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
    setResults(null);
    setError(null);
  };

  const processPhoto = async (): Promise<void> => {
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post<{ data: Nutrition }>(
        'http://localhost:8000/upload-image/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setResults({ nutrition: response.data.data });
    } catch (error) {
      setError('Failed to fetch nutritional information. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCapture = (): void => {
    setSelectedFile(null);
    setCapturedImage(null);
    setResults(null);
    setError(null);
    setFeedback(null);
    setIsEditing(false);
    setEditedResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFeedback = (isPositive: boolean): void => {
    setFeedback(isPositive);
    if (!isPositive && results) {
      setIsEditing(true);
      setEditedResults(JSON.parse(JSON.stringify(results))); // Deep copy
    }
  };

  const handleNutritionChange = (key: keyof Nutrition, value: number): void => {
    if (editedResults) {
      setEditedResults({
        ...editedResults,
        nutrition: { ...editedResults.nutrition, [key]: value },
      });
    }
  };

  const handleSaveEdits = (): void => {
    if (editedResults) {
      setResults(editedResults);
      setIsEditing(false);
      setFeedback(true);
    }
  };

  const NutritionItem: React.FC<{
    label: string;
    value: number;
    unit: string;
    editable: boolean;
    onChange: (value: number) => void;
  }> = ({ label, value, unit, editable, onChange }) => (
    <div className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
      <span className="font-medium">{label}</span>
      {editable ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-20 text-right border rounded px-1"
        />
      ) : (
        <span>{value}</span>
      )}
      <span className="ml-1">{unit}</span>
    </div>
  );

  return (
    <div className="max-w-md mx-auto p-4 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4 text-center">Analyze Your Food</h2>

      {!capturedImage && (
        <div className="space-y-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center"
          >
            <Camera className="mr-2" />
            Take Photo
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-gray-200 text-gray-800 p-3 rounded-lg flex items-center justify-center"
          >
            <Upload className="mr-2" />
            Upload Photo
          </button>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          <p className="text-sm text-gray-600 text-center">
            Take or upload a photo of your food to get started!
          </p>
        </div>
      )}

      {capturedImage && !results && (
        <div className="space-y-4 w-1/2">
          <img src={capturedImage} alt="Captured food" className="rounded" />
          <div className="flex space-x-2">
            <button
              onClick={resetCapture}
              className="flex-1  p-2 rounded-lg flex items-center justify-center"
            >
              <X className="mr-2" />
              Retake
            </button>
            <button
              onClick={processPhoto}
              className="flex-1 bg-green-500 text-white p-2 rounded-lg flex items-center justify-center"
            >
              <Check className="mr-2" />
              Analyze
            </button>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader className="animate-spin text-blue-500 mb-4" size={48} />
          <p className="text-lg font-semibold">Analyzing your food...</p>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center p-3 bg-red-100 rounded-lg">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Analysis Results</h3>
          <div className="bg-white p-4 rounded-lg shadow space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Nutritional Information:</h4>
              <NutritionItem
                label="Calories"
                value={
                  isEditing
                    ? editedResults?.nutrition.calories ?? 0
                    : results.nutrition.calories
                }
                unit="kcal"
                editable={isEditing}
                onChange={(value) => handleNutritionChange('calories', value)}
              />
              <NutritionItem
                label="Fat"
                value={
                  isEditing
                    ? editedResults?.nutrition.fat ?? 0
                    : results.nutrition.fat
                }
                unit="g"
                editable={isEditing}
                onChange={(value) => handleNutritionChange('fat', value)}
              />
              <NutritionItem
                label="Saturated Fat"
                value={
                  isEditing
                    ? editedResults?.nutrition.saturatedFat ?? 0
                    : results.nutrition.saturatedFat
                }
                unit="g"
                editable={isEditing}
                onChange={(value) =>
                  handleNutritionChange('saturatedFat', value)
                }
              />
              <NutritionItem
                label="Carbohydrate"
                value={
                  isEditing
                    ? editedResults?.nutrition.carbohydrate ?? 0
                    : results.nutrition.carbohydrate
                }
                unit="g"
                editable={isEditing}
                onChange={(value) =>
                  handleNutritionChange('carbohydrate', value)
                }
              />
              <NutritionItem
                label="Sugar"
                value={
                  isEditing
                    ? editedResults?.nutrition.sugar ?? 0
                    : results.nutrition.sugar
                }
                unit="g"
                editable={isEditing}
                onChange={(value) => handleNutritionChange('sugar', value)}
              />
              <NutritionItem
                label="Dietary Fiber"
                value={
                  isEditing
                    ? editedResults?.nutrition.dietaryFiber ?? 0
                    : results.nutrition.dietaryFiber
                }
                unit="g"
                editable={isEditing}
                onChange={(value) =>
                  handleNutritionChange('dietaryFiber', value)
                }
              />
              <NutritionItem
                label="Protein"
                value={
                  isEditing
                    ? editedResults?.nutrition.protein ?? 0
                    : results.nutrition.protein
                }
                unit="g"
                editable={isEditing}
                onChange={(value) => handleNutritionChange('protein', value)}
              />
              <NutritionItem
                label="Cholesterol"
                value={
                  isEditing
                    ? editedResults?.nutrition.cholesterol ?? 0
                    : results.nutrition.cholesterol
                }
                unit="mg"
                editable={isEditing}
                onChange={(value) =>
                  handleNutritionChange('cholesterol', value)
                }
              />
              <NutritionItem
                label="Sodium"
                value={
                  isEditing
                    ? editedResults?.nutrition.sodium ?? 0
                    : results.nutrition.sodium
                }
                unit="mg"
                editable={isEditing}
                onChange={(value) => handleNutritionChange('sodium', value)}
              />
            </div>
          </div>

          {feedback === null ? (
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => handleFeedback(true)}
                className="flex-1 bg-green-500 text-white p-3 rounded-lg flex items-center justify-center"
              >
                <ThumbsUp className="mr-2" />
                Confirm Results
              </button>
              <button
                onClick={() => handleFeedback(false)}
                className="flex-1 bg-red-500  p-3 rounded-lg flex items-center justify-center"
              >
                <ThumbsDown className="mr-2" />
                Edit Results
              </button>
            </div>
          ) : isEditing ? (
            <button
              onClick={handleSaveEdits}
              className="w-full bg-blue-500 text-white p-3 rounded-lg flex items-center justify-center"
            >
              <Save className="mr-2" />
              Save Edits
            </button>
          ) : (
            <div className="text-center p-3 bg-blue-100 text-blue-800 rounded-lg">
              Thank you for your feedback!
            </div>
          )}

          <button
            onClick={resetCapture}
            className="w-full bg-blue-500 text-white p-3 rounded-lg mt-4"
          >
            Analyze Another Photo
          </button>
        </div>
      )}
    </div>
  );
};

export default PhotoCapture;
