import { Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          NEW FEATURES LIVE
        </div>

        {/* Heading */}
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
          Simplify your digital reach
        </h1>

        {/* Subheading */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto">
          Transform long, ugly links into clean, trackable short URLs. OxLink
          makes sharing easier, cleaner, and faster.
        </p>
      </div>
    </section>
  );
}
