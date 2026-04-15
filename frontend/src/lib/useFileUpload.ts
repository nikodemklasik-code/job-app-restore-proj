import { useState } from 'react';

export function useFileUpload() {
  const [isDragging, setIsDragging] = useState(false);

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data URL prefix: "data:application/pdf;base64,ABC..." → "ABC..."
        resolve(result.split(',')[1] ?? result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const dragHandlers = {
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); },
    onDragLeave: () => setIsDragging(false),
    onDrop: (e: React.DragEvent, onFile: (file: File) => void) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) onFile(file);
    },
  };

  return { isDragging, fileToBase64, dragHandlers };
}
