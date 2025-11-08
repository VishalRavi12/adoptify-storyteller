import { Button } from "@/components/ui/button";
import { ArrowRight, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-20 sm:py-28 bg-gradient-hero relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center text-primary-foreground animate-fade-in">
          <Heart className="h-16 w-16 mx-auto mb-6 animate-float" />
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Adoption Marketing?
          </h2>
          
          <p className="text-lg sm:text-xl mb-8 opacity-90">
            Join hundreds of shelters using AI to find loving homes faster. 
            Start creating compelling adoption stories today.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              variant="secondary" 
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
            >
              <Link to="/composer">
                Create Your First Campaign
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white/10"
            >
              <Link to="/auth">
                Sign Up Free
              </Link>
            </Button>
          </div>
          
          <p className="mt-8 text-sm opacity-75">
            No credit card required • Free for small shelters • Cancel anytime
          </p>
        </div>
      </div>
      
      {/* Decorative circles */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
    </section>
  );
};

export default CTA;
