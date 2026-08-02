export const FREE_RESPONSE_MIN_LENGTH = 4;
export const FREE_RESPONSE_MAX_LENGTH = 160;

export function normalizeFreeResponse(value) {
  return value.replace(/\s+/g, " ").trim().slice(0, FREE_RESPONSE_MAX_LENGTH);
}

export function canSubmitFreeResponse(value) {
  return normalizeFreeResponse(value).length >= FREE_RESPONSE_MIN_LENGTH;
}

export function buildCustomOption(scene, value) {
  const text = normalizeFreeResponse(value);
  if (text.length < FREE_RESPONSE_MIN_LENGTH) {
    throw new Error(`Free response must contain at least ${FREE_RESPONSE_MIN_LENGTH} characters.`);
  }

  return {
    id: "custom-response",
    text,
    responseYue: scene.freeformFallback.responseYue,
    responseZh: scene.freeformFallback.responseZh,
    feedback: scene.freeformFallback.feedback,
    learningPoint: scene.freeformFallback.learningPoint,
    delta: { trust: 0, professionalism: 0, language: 0, culture: 0 },
    isCustom: true,
    inputKind: "free",
  };
}
