import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, Video, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";

const Composer = () => {
  const [petName, setPetName] = useState("");
  const [petBio, setPetBio] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = () => {
    toast({
      title: "Campaign generating! 🎉",
      description: "AI is creating your viral adoption content...",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Campaign Composer
            </h1>
            <p className="text-lg text-muted-foreground">
              Upload a pet photo and let AI create viral adoption content
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upload Section */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Pet Information
                </CardTitle>
                <CardDescription>
                  Share details about this adorable pet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="pet-name">Pet Name</Label>
                  <Input
                    id="pet-name"
                    placeholder="e.g., Luna"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pet-bio">Short Bio</Label>
                  <Textarea
                    id="pet-bio"
                    placeholder="Luna is a 2-year-old golden retriever who loves playing fetch and cuddling..."
                    value={petBio}
                    onChange={(e) => setPetBio(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pet-photo">Pet Photo</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                    <input
                      id="pet-photo"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <label htmlFor="pet-photo" className="cursor-pointer">
                      {selectedImage ? (
                        <img
                          src={selectedImage}
                          alt="Preview"
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                      ) : (
                        <>
                          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            PNG, JPG up to 10MB
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  className="w-full" 
                  size="lg"
                  onClick={handleGenerate}
                  disabled={!petName || !petBio || !selectedImage}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Campaign
                </Button>
              </CardContent>
            </Card>

            {/* Preview Section */}
            <div className="space-y-6 animate-slide-up [animation-delay:0.1s]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Features
                  </CardTitle>
                  <CardDescription>
                    What we'll generate for you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        Emotional Video Story
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        45-60 second video with music and captions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-secondary/10 p-2 rounded-lg">
                      <Sparkles className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        Viral Captions
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Platform-optimized captions for Instagram, TikTok & Facebook
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="bg-accent/10 p-2 rounded-lg">
                      <Share2 className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-1">
                        Smart Hashtags
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        SEO-optimized tags to maximize reach
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-hero text-primary-foreground border-0">
                <CardContent className="pt-6">
                  <h4 className="font-semibold mb-2">💡 Pro Tip</h4>
                  <p className="text-sm opacity-90">
                    Upload high-quality photos showing the pet's personality. 
                    Include unique traits or behaviors in the bio for the best AI-generated stories!
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Composer;
