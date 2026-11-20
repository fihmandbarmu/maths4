function parsePracticeAnswer(value) {
  const normalized = value.trim().replace(/,/g, '.');
  if (!normalized) return NaN;
  const fraction = normalized.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/);
  if (fraction) return Number(fraction[2]) === 0 ? NaN : Number(fraction[1]) / Number(fraction[2]);
  return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
}
