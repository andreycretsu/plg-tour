import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { MagnetLines } from "@/components/ui/magnet-lines"
import { TiltedCard } from "@/components/ui/tilted-card"

export default function LoginPage() {
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
            <LoginForm />
          </div>
        </div>
      </div>
      
      {/* Right section - tilted tour card */}
      <div className="relative hidden lg:flex items-center justify-center">
        <TiltedCard className="w-full max-w-[400px]">
          <div 
            className="bg-white rounded-xl shadow-lg p-6"
            style={{
              borderRadius: '12px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
            }}
          >
            <div className="mb-4">
              <div className="w-full h-48 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg mb-4 flex items-center justify-center">
                <GalleryVerticalEnd className="size-12 text-white opacity-80" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to TourLayer
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Create interactive product tours and tooltips that guide your users through your application with ease.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '33%' }} />
                </div>
                <span className="text-xs text-gray-500">Step 1 of 3</span>
              </div>
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors">
              Get Started
            </button>
          </div>
        </TiltedCard>
      </div>
    </div>
  )
}
