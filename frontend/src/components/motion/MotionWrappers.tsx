/**
 * Reusable animation wrapper components
 * Premium scroll-reveal motion components
 */

import { ReactNode } from 'react'
import { motion, MotionProps } from 'framer-motion'
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
interface FadeUpSectionProps extends MotionProps {
  children: ReactNode
  className?: string
}

export function FadeUpSection({ children, className, ...props }: FadeUpSectionProps) {
  return (
    <motion.div
      variants={fadeUpVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * FadeInSection - Subtle opacity reveal
 * Pure fade without movement
 */
interface FadeInSectionProps extends MotionProps {
  children: ReactNode
  className?: string
}

export function FadeInSection({ children, className, ...props }: FadeInSectionProps) {
  return (
    <motion.div
      variants={fadeInVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * ScaleInCard - Cards and feature blocks
 * Fades in, scales up slightly, and moves up
 */
interface ScaleInCardProps extends MotionProps {
  children: ReactNode
  className?: string
}

export function ScaleInCard({ children, className, ...props }: ScaleInCardProps) {
  return (
    <motion.div
      variants={scaleInVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * SlideInLeft - Text content from left
 * Used in two-column layouts (text on left)
 */
interface SlideInLeftProps extends MotionProps {
  children: ReactNode
  className?: string
}

export function SlideInLeft({ children, className, ...props }: SlideInLeftProps) {
  return (
    <motion.div
      variants={slideInLeftVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * SlideInRight - Images from right
 * Used in two-column layouts (image on right)
 */
interface SlideInRightProps extends MotionProps {
  children: ReactNode
  className?: string
}

export function SlideInRight({ children, className, ...props }: SlideInRightProps) {
  return (
    <motion.div
      variants={slideInRightVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={scrollViewportSettings}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerContainer - Parent for staggered child animations
 * Wraps multiple items to create cascade effect
 */
interface StaggerContainerProps extends MotionProps {
  children: ReactNode
  className?: string
  staggerChildren?: number
  delayChildren?: number
}

export function StaggerContainer({
  children,
  className,
  staggerChildren = 0.12,
  delayChildren = 0.1,
  ...props
}: StaggerContainerProps) {
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
      {...props}
    >
      {children}
    </motion.div>
  )
}

/**
 * StaggerItem - Child element within StaggerContainer
 * Each item animates with stagger delay
 */
interface StaggerItemProps extends MotionProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
  return (
    <motion.div variants={staggerItemVariants} className={className} {...props}>
      {children}
    </motion.div>
  )
}

/**
 * HeroContent - Sequential reveal for hero sections
 * Title → Subtitle → CTA with delays
 */
interface HeroContentProps {
  children: ReactNode
  className?: string
}

export function HeroContent({ children, className }: HeroContentProps) {
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
