import { LinkIcon } from "lucide-react";

export function AuthLeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-muted/30 relative overflow-hidden">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center p-12 text-foreground w-full">
        {/* Logo - Top Left */}
        <div className="absolute top-8 left-8">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <LinkIcon className="h-7 w-7" />
          </div>
        </div>

        {/* Main Content - Centered */}
        <div className="text-center space-y-6 max-w-md">
          <h1 className="text-5xl font-bold leading-tight">
            Simplify your links,
            <br />
            amplify your reach
          </h1>
          <p className="text-lg text-muted-foreground">
            OxLink provides the most reliable and fastest URL shortening service
            with detailed analytics to track your success.
          </p>

          {/* Social Proof - Below Text */}
          <div className="flex flex-col items-center gap-3 pt-4">
            <div className="flex -space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 border-2 border-white" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-white" />
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-white" />
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-yellow-300">
                {"★★★★★".split("").map((star, i) => (
                  <span key={i}>{star}</span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                Trusted by 10k+ users
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
