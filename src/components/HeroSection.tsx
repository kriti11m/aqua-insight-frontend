import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TryFloatChatButton } from '@/components/TryFloatChatButton';
import oceanWavesBg from '../assets/ocean-waves-bg.jpg';
import oceanGlobe from '../assets/ocean-globe.jpg';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Ocean Waves Background with Blur and Gradient */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat filter blur-sm"
        style={{ backgroundImage: `url(${oceanWavesBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-teal-900/30 to-blue-800/50" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-background/20" />
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-screen">
          
          {/* Left Side - Text Content */}
          <div className="space-y-8 animate-slide-in-up">
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                <span className="text-white">Chat with the </span>
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Ocean's Data
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 max-w-2xl leading-relaxed">
                Ask questions like <em className="text-cyan-300">"What's the salinity near the equator?"</em> and get instant graphs + maps from real ocean scientific data.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <TryFloatChatButton 
                size="lg" 
                className="px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl" 
              />
              <Button variant="outline" className="px-8 py-4 text-lg font-semibold border-2 border-cyan-400/50 text-cyan-300 hover:bg-cyan-400/10 hover:border-cyan-400 rounded-full transition-all duration-300">
                Watch Demo
              </Button>
            </div>
            
            <div className="pt-4">
              <Link to="/dashboard" className="text-cyan-400 hover:text-cyan-300 underline">
                Or explore the full dashboard →
              </Link>
            </div>
          </div>
          
          {/* Right Side - Clipped Globe */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-80 h-80 lg:w-96 lg:h-96">
              {/* Circular container with glowing border */}
              <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-cyan-400/50 shadow-2xl">
                {/* Inner glow effect */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/20 via-blue-500/10 to-transparent animate-pulse" />
                
                {/* Globe Image - clipped to circle */}
                <img 
                  src={oceanGlobe} 
                  alt="Ocean Globe" 
                  className="w-full h-full object-cover rounded-full animate-float"
                />
                
                {/* Outer glow ring */}
                <div className="absolute -inset-2 rounded-full border border-cyan-400/30 animate-pulse" style={{ animationDuration: '3s' }} />
                <div className="absolute -inset-4 rounded-full border border-blue-400/20 animate-pulse" style={{ animationDuration: '4s' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;