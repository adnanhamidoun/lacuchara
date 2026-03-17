/**
 * Reusable animation wrapper components
 * Premium scroll-reveal motion components for Framer Motion
 */

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  fadeUpVariants,
  fadeInVariants,
  scaleInVariants,
  slideInLeftVariants,
  slideInRightVariants,
  staggerItemVariants,
  scrollViewportSettings,
  shouldReduceMotion,
} from '../../utils/animations'

/**
 * FadeUpSection - Text blocks and section content reveal
 * Fades in and slides up from below
 */
export function FadeUpSection({ children, className = '' }) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * FadeInSection - Subtle opacity reveal
 * Pure fade without movement
 */
export function FadeInSection({ children, className = '' }) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * ScaleInCard - Cards and feature blocks
 * Fades in, scales up slightly, and moves up
 */
export function ScaleInCard({ children, className = '' }) {
  return (
    <motion.div
      variants={scaleInVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * SlideInLeft - Text content from left
 * Used in two-column layouts (text on left)
 */
export function SlideInLeft({ children, className = '' }) {
  return (
    <motion.div
      variants={slideInLeftVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * SlideInRight - Images from right
 * Used in two-column layouts (image on right)
 */
export function SlideInRight({ children, className = '' }) {
  return (
    <motion.div
      variants={slideInRightVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerContainer - Parent for staggered child animations
 * Wraps multiple items to create cascade effect
 */
export function StaggerContainer({
  children,
  className = '',
  staggerChildren = 0.12,
  delayChildren = 0.1,
}) {
  const reducedMotion = shouldReduceMotion()

  return (
    <motion.div
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      transition={{
        staggerChildren: reducedMotion ? 0 : staggerChildren,
        delayChildren: reducedMotion ? 0 : delayChildren,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerItem - Child element within StaggerContainer
 * Each item animates with stagger delay
 */
export function StaggerItem({ children, className = '' }) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  )
}

/**
 * HeroContent - Sequential reveal for hero sections
 * Title → Subtitle → CTA with delays
 */
export function HeroContent({ children, className = '' }) {
  return (
    <motion.div
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  )
}
