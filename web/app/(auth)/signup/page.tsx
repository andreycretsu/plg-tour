import { GalleryVerticalEnd } from "lucide-react"
import { SignupForm } from "@/components/signup-form"
import { MagnetLines } from "@/components/ui/magnet-lines"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 relative overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Magnet Lines effect - covers entire page background */}
      <div className="absolute inset-0">
        <MagnetLines 
          className="w-full h-full"
          lineColor="#d0d0d0"
          lineWidth={1}
          numLines={50}
        />
      </div>
      
      {/* Left section - white card */}
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
            <SignupForm />
          </div>
        </div>
      </div>
      
      {/* Right section - empty, magnet lines show through */}
      <div className="relative hidden lg:block" />
    </div>
  )
}
