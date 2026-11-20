function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(pattern);
    } catch {
      // ignore unsupported environments
    }
  }
}

export function hapticCorrect() {
  vibrate(10);
}

export function hapticWrong() {
  vibrate([22, 35, 22]);
}

export function hapticRecord() {
  vibrate([14, 28, 14, 28, 36]);
}
