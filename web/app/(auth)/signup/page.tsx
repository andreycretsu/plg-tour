import { GalleryVerticalEnd } from "lucide-react"
import { SignupForm } from "@/components/signup-form"
import { TiltedCard } from "@/components/ui/tilted-card"

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2 relative overflow-hidden" style={{ backgroundColor: '#F5F5F5' }}>
      {/* Left section - white card */}
      <div className="relative flex flex-col gap-4 p-6 md:p-10 bg-white m-6 rounded-[32px] shadow-md z-20">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Walko
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[460px] bg-white m-6 p-6">
            <SignupForm />
          </div>
        </div>
      </div>
      
      {/* Right section - tilted tour card */}
      <div className="relative hidden lg:flex items-center justify-center z-20">
        <TiltedCard className="w-full max-w-[100px]">
          <div 
            className="backdrop-blur-[2px] bg-[rgba(255,255,255,0.4)] rounded-[4.5px] w-[100px] h-[121px] relative"
            style={{
              backdropFilter: 'blur(2px)',
            }}
          >
            {/* Image */}
            <div 
              className="absolute border-[#c7c7c7] border-[0.5px] border-solid h-[54px] left-[-6.25px] rounded-[3px] top-[4.75px] w-[112.75px] overflow-hidden"
            >
              <div 
                className="absolute inset-0 overflow-hidden pointer-events-none rounded-[3px]"
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'800\' height=\'600\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cdefs%3E%3ClinearGradient id=\'grad\' x1=\'0%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'0%25\' style=\'stop-color:%23667eea;stop-opacity:1\' /%3E%3Cstop offset=\'100%25\' style=\'stop-color:%23764ba2;stop-opacity:1\' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=\'800\' height=\'600\' fill=\'url(%23grad)\'/%3E%3C/svg%3E")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </div>
            
            {/* Content */}
            <div className="absolute content-stretch flex flex-col gap-[3px] items-start left-[6px] top-[62.75px] w-[88px]">
              <p className="font-semibold leading-none min-w-full not-italic relative shrink-0 text-[8px] text-black w-[min-content]">
                Welcome to Walko
              </p>
              <p className="font-normal leading-[1.2] min-w-full not-italic relative shrink-0 text-[6px] text-black w-[min-content]">
                Create interactive product tours and tooltips that guide your users through your application with ease
              </p>
              
              {/* Progress indicator */}
              <div className="box-border content-stretch flex flex-col gap-[2.5px] items-start px-0 py-[3px] relative shrink-0 w-[88px]">
                <div className="content-stretch flex gap-[2.5px] h-[2px] items-center relative shrink-0 w-full">
                  <div className="basis-0 bg-[#ffda70] grow h-full min-h-px min-w-px rounded-[1px] shrink-0" />
                  <div className="basis-0 bg-[#ffda70] grow h-full min-h-px min-w-px rounded-[1px] shrink-0" />
                  <div className="basis-0 bg-[#ffda70] grow h-full min-h-px min-w-px rounded-[1px] shrink-0" />
                  <div className="basis-0 bg-[#e3e3e3] grow h-full min-h-px min-w-px rounded-[1px] shrink-0" />
                  <div className="basis-0 bg-[#e3e3e3] grow h-full min-h-px min-w-px rounded-[1px] shrink-0" />
                  <div className="basis-0 bg-[#e3e3e3] grow h-full min-h-px min-w-px rounded-[1px] shrink-0" />
                  <div className="basis-0 bg-[#e3e3e3] grow h-full min-h-px min-w-px rounded-[1px] shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </TiltedCard>
      </div>
    </div>
  )
}
