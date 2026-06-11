const MAX_INPUT_MB = 15;
const MAX_SIDE = 1200;
const TARGET_MAX_BYTES = 600 * 1024;

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Не удалось прочитать изображение'));
    reader.readAsDataURL(blob);
  });
}

async function canvasToJpegBlob(
  source: CanvasImageSource,
  width: number,
  height: number,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Не удалось обработать изображение');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
  });

  if (!blob) throw new Error('Не удалось сжать изображение');
  return blob;
}

/** Сжимает фото перед загрузкой: до 1200px, JPEG, обычно 50–300 КБ */
export async function compressImageFile(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Выберите изображение (JPG, PNG, WEBP)');
  }
  if (file.size > MAX_INPUT_MB * 1024 * 1024) {
    throw new Error(`Файл слишком большой. Максимум ${MAX_INPUT_MB} МБ`);
  }

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(MAX_SIDE / bitmap.width, MAX_SIDE / bitmap.height, 1);
  const width = Math.max(1, Math.round(bitmap.width * ratio));
  const height = Math.max(1, Math.round(bitmap.height * ratio));

  let quality = 0.85;
  let blob = await canvasToJpegBlob(bitmap, width, height, quality);

  while (blob.size > TARGET_MAX_BYTES && quality > 0.45) {
    quality -= 0.1;
    blob = await canvasToJpegBlob(bitmap, width, height, quality);
  }

  bitmap.close();
  return blob;
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  const blob = await compressImageFile(file);
  return blobToDataUrl(blob);
}
