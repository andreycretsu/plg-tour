import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { ChalkboardGrid } from "@/components/ui/chalkboard-grid"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 relative overflow-hidden">
      {/* Chalkboard background with texture - covers entire page */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundColor: '#1a3d0f',
          backgroundImage: `
            radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 0),
            radial-gradient(circle at 8px 8px, rgba(255,255,255,0.05) 1px, transparent 0),
            radial-gradient(circle at 15px 15px, rgba(255,255,255,0.03) 1px, transparent 0)
          `,
          backgroundSize: '20px 20px, 25px 25px, 30px 30px',
        }}
      />
      
      {/* Left section - solid dark green with texture (1/3) */}
      <div className="relative flex flex-col gap-4 p-6 md:p-10 bg-white m-6 rounded-[32px] shadow-md z-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            TourLayer
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[460px] bg-white m-6 p-6">
            <LoginForm />
          </div>
        </div>
      </div>
      
      {/* Right section - grid pattern (2/3) */}
      <div className="relative hidden lg:block">
        <ChalkboardGrid className="absolute inset-0" />
      </div>
    </div>
  )
}
