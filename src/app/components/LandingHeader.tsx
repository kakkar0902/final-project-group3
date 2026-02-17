/**
 * @module app/components/LandingHeader
 * @description Landing page header hero section with call-to-action buttons and background image
 */

import Link from "next/link";
import Image from "next/image";

/**
 * Landing page header/hero section with navigation CTAs.
 * 
 * Features:
 * - High-quality background image showcasing woodworking from Cloudinary
 * - Dark overlay for text readability
 * - Prominent title and description
 * - "View Our Work" button linking to Projects page
 * - "Get in Touch" button linking to Contact page
 * - Responsive design
 * 
 * @returns The header JSX element
 * 
 * @example
 * ```tsx
 * <LandingHeader />
 * ```
 */
export default function LandingHeader() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image from Cloudinary */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://res.cloudinary.com/dv2s0vhyh/image/upload/v1771319355/08dfaa59-e639-4bd0-a270-c0873c060b52_lidm5g.jpg"
          alt="Shoreline Woodworks - Interior woodworking"
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-white drop-shadow-lg">
          Shoreline Woodworks
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto drop-shadow">
          Crafted woodworking projects that transform spaces with beauty and quality.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/projects"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-accent text-accent-foreground font-semibold hover:opacity-90 transition-opacity duration-200 shadow-lg"
          >
            View Our Work
          </Link>
          
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg border-2 border-white text-white font-semibold hover:bg-white/20 transition-colors duration-200 backdrop-blur-sm shadow-lg"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </section>
  );
}
