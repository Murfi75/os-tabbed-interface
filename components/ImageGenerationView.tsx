import React, { useState, useCallback } from 'react';
import { geminiService } from '../services/geminiService';

type AspectRatioOption = "SQUARE" | "PORTRAIT" | "LANDSCAPE";

const ImageGenerationView: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageUrls, setImageUrls] = useState<string[]>([]); // Changed from string|null
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [numberOfImages, setNumberOfImages] = useState<number>(1);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>('SQUARE');
  const [negativePrompt, setNegativePrompt] = useState<string>('');


  const handleGenerateImage = useCallback(async () => {
    if (!prompt.trim()) {
      setError("Пожалуйста, введите описание изображения.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setImageUrls([]); // Clear previous images

    try {
      const base64Images = await geminiService.generateImage(
        prompt.trim(),
        numberOfImages,
        aspectRatio,
        negativePrompt.trim() || undefined
      );
      if (base64Images && base64Images.length > 0) {
        setImageUrls(base64Images.map(base64 => `data:image/jpeg;base64,${base64}`));
      } else {
        setError("Не удалось сгенерировать изображение. Ответ API был пустым или не содержал изображений.");
      }
    } catch (e: any) {
      console.error("Image generation error:", e);
      setError(e.message || "Произошла ошибка при генерации изображения.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, numberOfImages, aspectRatio, negativePrompt]);

  return (
    <div className="max-w-2xl mx-auto text-sm flex flex-col items-center">
      <h2 className="text-2xl font-semibold text-sky-300 mb-6 text-center">Генератор Изображений</h2>
      
      {/* Main Prompt Input */}
      <div className="w-full mb-4 p-1 bg-slate-700 rounded-lg flex items-center">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleGenerateImage()}
          placeholder="Введите описание изображения..."
          className="flex-grow p-3 bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none"
          disabled={isLoading}
          aria-label="Описание изображения для генерации"
        />
        <button
          onClick={handleGenerateImage}
          disabled={isLoading || !prompt.trim()}
          className="p-3 bg-sky-600 text-white rounded-md hover:bg-sky-500 disabled:bg-slate-500 disabled:cursor-not-allowed transition-colors duration-150 ml-2 shrink-0"
          aria-live="polite"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            "Сгенерировать"
          )}
        </button>
      </div>

      {/* Additional Controls */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="num-images-select" className="block text-xs text-slate-300 mb-1">Количество изображений:</label>
          <select 
            id="num-images-select"
            value={numberOfImages} 
            onChange={(e) => setNumberOfImages(parseInt(e.target.value, 10))}
            disabled={isLoading}
            className="w-full p-2 text-xs bg-slate-600 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-500"
            aria-label="Выберите количество изображений"
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
        </div>
        <div>
          <label htmlFor="aspect-ratio-select" className="block text-xs text-slate-300 mb-1">Соотношение сторон:</label>
          <select 
            id="aspect-ratio-select"
            value={aspectRatio} 
            onChange={(e) => setAspectRatio(e.target.value as AspectRatioOption)}
            disabled={isLoading}
            className="w-full p-2 text-xs bg-slate-600 text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-500"
            aria-label="Выберите соотношение сторон"
          >
            <option value="SQUARE">Квадрат (1:1)</option>
            <option value="LANDSCAPE">Пейзаж (16:9)</option>
            <option value="PORTRAIT">Портрет (9:16)</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label htmlFor="negative-prompt-input" className="block text-xs text-slate-300 mb-1">Негативный промпт (опционально):</label>
          <input
            id="negative-prompt-input"
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="например, текст, водяной знак, размытость"
            className="w-full p-2 text-xs bg-slate-600 text-slate-100 placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 border border-slate-500"
            disabled={isLoading}
            aria-label="Введите негативный промпт"
          />
        </div>
      </div>

      {error && <p role="alert" className="text-red-400 text-sm mb-4 text-center bg-red-900/30 p-2 rounded-md">{error}</p>}

      {/* Image Display Area */}
      <div className="w-full min-h-[20rem] sm:min-h-[24rem] bg-slate-700/50 rounded-lg flex items-center justify-center mt-2 p-2 border border-slate-600">
        {isLoading && (
          <div className="text-center text-slate-400">
            <svg className="animate-spin h-10 w-10 text-sky-400 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Генерация изображения...
          </div>
        )}
        {!isLoading && imageUrls.length > 0 && (
          <div className={`grid gap-2 w-full h-full ${imageUrls.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
            {imageUrls.map((url, index) => (
              <div key={index} className="bg-slate-600/50 rounded flex items-center justify-center p-1">
                <img 
                  src={url} 
                  alt={`${prompt || 'Сгенерированное изображение'} ${index + 1}`}
                  className="max-w-full max-h-full object-contain rounded"
                  style={{ maxHeight: imageUrls.length > 1 ? 'calc( (24rem - 1rem) / 2 )' : '24rem' }} // Adjust max height for grid
                />
              </div>
            ))}
          </div>
        )}
        {!isLoading && imageUrls.length === 0 && !error && (
          <p className="text-slate-400">Изображение появится здесь</p>
        )}
         {!isLoading && imageUrls.length === 0 && error && ( // Show only when an error occurred and no images loaded
          <p className="text-slate-400">Не удалось загрузить изображение из-за ошибки</p>
        )}
      </div>
       <p className="text-xs text-slate-500 mt-3 text-center">
        Используется модель: {geminiService.getImageGenModelName()}
      </p>
    </div>
  ); 
};

export default ImageGenerationView;