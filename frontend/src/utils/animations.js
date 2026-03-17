/**
 * Animation utilities and variants for Framer Motion
 * Premium scroll-based reveal animations with accessibility support
 */

// Check if user prefers reduced motion
export const shouldReduceMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Fade up animation for text blocks and sections
 * Used for headers, descriptions, and content blocks
 */
export const fadeUpVariants = {
  initial: {
    opacity: 0,
    y: 24,
  },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

/**
 * Fade in animation for subtle reveals
 * Used for backgrounds, overlays, and secondary content
 */
export const fadeInVariants = {
  initial: {
    opacity: 0,
  },
  whileInView: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
}

/**
 * Scale and fade animation for cards and feature blocks
 * Creates subtle depth effect
 */
export const scaleInVariants = {
  initial: {
    opacity: 0,
    scale: 0.98,
    y: 30,
  },
  whileInView: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

/**
 * Slide from left animation
 * Used for text content in about/feature sections
 */
export const slideInLeftVariants = {
  initial: {
    opacity: 0,
    x: -24,
  },
  whileInView: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

/**
 * Slide from right animation
 * Used for images in about/feature sections
 */
export const slideInRightVariants = {
  initial: {
    opacity: 0,
    x: 24,
  },
  whileInView: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
}

/**
 * Stagger item variants - use with stagger container
 * Children inherit stagger timing
 */
export const staggerItemVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
}

/**
 * Hero section animations - sequential reveal
 * Animates headline, subtitle, and CTA separately
 */
export const heroHeadlineVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
    },
  },
}

export const heroSubtitleVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
      delay: 0.2,
    },
  },
}

export const heroCtaVariants = {
  initial: { opacity: 0, y: 24, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
      delay: 0.4,
    },
  },
}

/**
 * Viewport settings for scroll-triggered animations
 */
export const scrollViewportSettings = {
  once: true,
  amount: 0.2,
}

/**
 * Viewport settings with higher threshold (for hero-like sections)
 */
export const scrollViewportSettingsHigh = {
  once: true,
  amount: 0.5,
}

/**
 * Get motion variants based on prefers-reduced-motion
 * Returns instant animation for accessibility
 */
export const getAccessibleVariants = (variants) => {
  if (shouldReduceMotion()) {
    const result = { ...variants }
    if (result.whileInView && typeof result.whileInView === 'object') {
      result.whileInView = {
        ...result.whileInView,
        transition: {
          duration: 0.1,
        },
      }
    }
    return result
  }
  return variants
}
