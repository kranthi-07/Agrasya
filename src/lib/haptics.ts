"use client";

/**
 * Agrasya Smooth Haptic Feedback Utility
 * Uses the Web Vibration API with finely-tuned micro-durations
 * to replicate native iOS / Android Taptic Engine pulses.
 */
export type HapticStyle = "selection" | "light" | "medium" | "heavy" | "success" | "warning";

export function triggerHaptic(style: HapticStyle = "selection"): void {
  if (typeof window === "undefined") return;

  // Check if the device / browser supports the Vibration API
  if (typeof navigator !== "undefined" && "vibrate" in navigator && typeof navigator.vibrate === "function") {
    try {
      switch (style) {
        case "selection":
          // Ultra-crisp micro tick (10ms) - perfect for tabs, pills, and toggles
          navigator.vibrate(10);
          break;
        case "light":
          // Soft tap (14ms) - ideal for icon clicks & buttons
          navigator.vibrate(14);
          break;
        case "medium":
          // Subtle pop (22ms) - ideal for switching views or opening panels
          navigator.vibrate(22);
          break;
        case "heavy":
          // Firm tap (32ms) - for drag drop & important triggers
          navigator.vibrate(32);
          break;
        case "success":
          // Apple-style double pulse: tick (12ms) - rest (35ms) - tick (18ms)
          navigator.vibrate([12, 35, 18]);
          break;
        case "warning":
          // Alert pulse: tick (25ms) - rest (40ms) - tick (25ms)
          navigator.vibrate([25, 40, 25]);
          break;
        default:
          navigator.vibrate(12);
      }
    } catch {
      // Graceful silence if vibration is disallowed by permissions or device policy
    }
  }
}
