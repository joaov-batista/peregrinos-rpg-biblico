// Celulares de alta densidade precisam de mais de 2 pixels por pixel CSS.
// O limite total protege aparelhos com telas muito grandes sem reduzir o PC.
export function canvasDpr(width, height, deviceDpr = 1, mobile = false, sharp = true) {
  const native = Number.isFinite(deviceDpr) && deviceDpr > 0 ? deviceDpr : 1;
  if (!mobile || !sharp) return Math.min(2, native);
  return Math.min(native, 4, Math.sqrt(8_000_000 / Math.max(1, width * height)));
}
