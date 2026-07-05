/** 스크린샷 전처리 — 순위표 영역 크롭 + 확대 + 대비 */
export async function preprocessScoreScreenshot(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const cropTop = Math.floor(bitmap.height * 0.26);
  const cropHeight = Math.floor(bitmap.height * 0.72);
  const scale = Math.max(2, 1500 / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(cropHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(
    bitmap,
    0,
    cropTop,
    bitmap.width,
    cropHeight,
    0,
    0,
    width,
    height,
  );

  const imageData = ctx.getImageData(0, 0, width, height);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const boosted = Math.min(255, Math.max(0, (gray - 128) * 1.4 + 128));
    d[i] = d[i + 1] = d[i + 2] = boosted;
  }
  ctx.putImageData(imageData, 0, 0);

  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("전처리 실패"));
          return;
        }
        resolve(new File([blob], "preprocessed.png", { type: "image/png" }));
      },
      "image/png",
      1,
    );
  });
}
