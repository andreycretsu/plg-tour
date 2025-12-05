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
        <TiltedCard className="w-full max-w-[400px]">
          <div 
            className="backdrop-blur-[2px] bg-[rgba(255,255,255,0.4)] rounded-[18px] w-[400px] h-[484px] relative"
            style={{
              backdropFilter: 'blur(2px)',
            }}
          >
            {/* Image */}
            <div 
              className="absolute border-[#c7c7c7] border-[0.5px] border-solid h-[216px] left-[-25px] rounded-[12px] top-[19px] w-[451px] overflow-hidden"
            >
              <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[12px]">
                <img 
                  alt="Walko preview" 
                  className="absolute h-[175.3%] left-[-5.99%] max-w-none top-[-19.3%] w-[111.98%] object-cover"
                  src="http://localhost:3845/assets/ca09867c21c144cd5ebf64e599be1994a116b0c5.png"
                />
              </div>
            </div>
            
            {/* Content */}
            <div className="absolute content-stretch flex flex-col gap-[12px] items-start left-[24px] top-[251px] w-[352px]">
              <p className="font-semibold leading-none min-w-full not-italic relative shrink-0 text-[32px] text-black w-[min-content]">
                Welcome to Walko
              </p>
              <p className="font-normal leading-[1.2] min-w-full not-italic relative shrink-0 text-[24px] text-black w-[min-content]">
                Create interactive product tours and tooltips that guide your users through your application with ease
              </p>
              
              {/* Progress indicator */}
              <div className="box-border content-stretch flex flex-col gap-[10px] items-start px-0 py-[12px] relative shrink-0 w-[352px]">
                <div className="content-stretch flex gap-[10px] h-[8px] items-center relative shrink-0 w-full">
                  <div className="basis-0 bg-[#ffda70] grow h-full min-h-px min-w-px rounded-[4px] shrink-0" />
                  <div className="basis-0 bg-[#ffda70] grow h-full min-h-px min-w-px rounded-[4px] shrink-0" />
                  <div className="basis-0 bg-[#ffda70] grow h-full min-h-px min-w-px rounded-[4px] shrink-0" />
                  <div className="basis-0 bg-[#e3e3e3] grow h-full min-h-px min-w-px rounded-[4px] shrink-0" />
                  <div className="basis-0 bg-[#e3e3e3] grow h-full min-h-px min-w-px rounded-[4px] shrink-0" />
                  <div className="basis-0 bg-[#e3e3e3] grow h-full min-h-px min-w-px rounded-[4px] shrink-0" />
                  <div className="basis-0 bg-[#e3e3e3] grow h-full min-h-px min-w-px rounded-[4px] shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </TiltedCard>
      </div>
    </div>
  )
}
