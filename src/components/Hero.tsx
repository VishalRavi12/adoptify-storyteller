import { Button } from "@/components/ui/button";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-dog.jpg";

const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-warm">
      <div className="container mx-auto px-4 py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 mb-6">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">AI-Powered Adoption Marketing</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
              Turn Shelter Pets Into
              <span className="block text-primary mt-2">Viral Success Stories</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed">
              Adoptify uses AI to transform pet photos into emotional, shareable adoption videos. 
              Help shelters find loving homes faster with the power of storytelling.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="hero" size="lg" className="group">
                <Link to="/composer">
                  Start Creating
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg">
                <Link to="/auth">
                  Sign In
                </Link>
              </Button>
            </div>
            
            <div className="mt-12 flex items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <span>Increase adoptions by 3x</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-secondary" />
                <span>AI-powered content</span>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative animate-slide-up">
            <div className="relative rounded-3xl overflow-hidden shadow-hover">
              <img 
                src={heroImage} 
                alt="Happy adoptable pet"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-6 shadow-hover animate-float hidden sm:block">
              <div className="text-3xl font-bold text-primary">1000+</div>
              <div className="text-sm text-muted-foreground">Pets Found Homes</div>
            </div>
            
            <div className="absolute -top-6 -right-6 bg-card rounded-2xl p-6 shadow-hover animate-float [animation-delay:1s] hidden sm:block">
              <div className="text-3xl font-bold text-secondary">85%</div>
              <div className="text-sm text-muted-foreground">Faster Adoptions</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -z-10" />
    </section>
  );
};

export default Hero;
