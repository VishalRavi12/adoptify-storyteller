import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Sparkles, Video, Share2, Loader2, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { GenerateVideoResponse, VideoProvider, inferDataUrlMimeType, requestVideoGeneration } from "@/lib/api";
import { cn } from "@/lib/utils";

const PROVIDER_CONFIG: Record<
  VideoProvider,
  { label: string; helper: string; progress: string; successHint: string }
> = {
  openai: {
    label: "OpenAI Sora",
    helper: "Highest fidelity cinematic clips.",
    progress: "Rendering with OpenAI Sora...",
    successHint: "the OpenAI clip",
  },
  gemini: {
    label: "Gemini Veo",
    helper: "Fast Veo 3.1 preview from Google AI.",
    progress: "Rendering with Gemini Veo...",
    successHint: "the Gemini clip",
  },
};

const PROVIDER_ORDER: VideoProvider[] = ["openai", "gemini"];

const Composer = () => {
  const [petName, setPetName] = useState("");
  const [petBio, setPetBio] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [provider, setProvider] = useState<VideoProvider>("openai");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<GenerateVideoResponse | null>(null);
  const { toast } = useToast();

  const activeProviderLabel =
    videoResult?.providerLabel ?? PROVIDER_CONFIG[provider].label;

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

  const handleGenerate = async () => {
    if (!petName || !petBio || !selectedImage) {
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    const providerMeta = PROVIDER_CONFIG[provider];

    toast({
      title: "Campaign generating! 🎉",
      description: `${providerMeta.label} is creating your adoption content...`,
    });

    try {
      const result = await requestVideoGeneration({
        petName,
        petBio,
        petImage: selectedImage,
        mimeType: inferDataUrlMimeType(selectedImage),
        provider,
      });

      setVideoResult(result);
      toast({
        title: "Video ready!",
        description: `Scroll down to preview and download ${
          result.providerLabel ?? providerMeta.label
        }.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while talking to the AI provider.";
      setGenerationError(message);
      toast({
        title: "Generation failed",
        description: `${PROVIDER_CONFIG[provider].label} run failed: ${message}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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

                <div className="space-y-2">
                  <Label>AI Provider</Label>
                  <RadioGroup
                    value={provider}
                    onValueChange={(value) =>
                      setProvider((value as VideoProvider) ?? "openai")
                    }
                    className="grid gap-3 md:grid-cols-2"
                  >
                    {PROVIDER_ORDER.map((option) => {
                      const optionId = `provider-${option}`;
                      const isActive = provider === option;
                      return (
                        <div
                          key={option}
                          className={cn(
                            "rounded-lg border p-3 transition hover:border-primary/70",
                            isActive
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-border"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <RadioGroupItem id={optionId} value={option} />
                            <div>
                              <Label
                                htmlFor={optionId}
                                className="font-semibold cursor-pointer"
                              >
                                {PROVIDER_CONFIG[option].label}
                              </Label>
                              <p className="text-xs text-muted-foreground mt-1">
                                {PROVIDER_CONFIG[option].helper}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>

                <Button 
                  variant="hero" 
                  className="w-full" 
                  size="lg"
                  onClick={handleGenerate}
                  disabled={!petName || !petBio || !selectedImage || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {PROVIDER_CONFIG[provider].progress}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate with {PROVIDER_CONFIG[provider].label}
                    </>
                  )}
                </Button>
                {generationError && (
                  <p className="text-sm text-destructive text-center">
                    {generationError}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Preview Section */}
            <div className="space-y-6 animate-slide-up [animation-delay:0.1s]">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    {activeProviderLabel} Output
                  </CardTitle>
                  <CardDescription>
                    Preview and share the {activeProviderLabel} adoption story
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {videoResult ? (
                    <>
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        {videoResult.message}
                      </div>
                      <video
                        controls
                        playsInline
                        className="w-full rounded-lg border border-border shadow-sm"
                        src={videoResult.videoUrl}
                      />
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          <span className="font-semibold text-foreground">
                            Provider:
                          </span>{" "}
                          {activeProviderLabel}
                        </p>
                        <p>
                          <span className="font-semibold text-foreground">
                            Model:
                          </span>{" "}
                          {videoResult.model ?? "sora-2"}
                        </p>
                        <p>
                          <span className="font-semibold text-foreground">
                            Video ID:
                          </span>{" "}
                          {videoResult.jobId}
                        </p>
                        <p>
                          <span className="font-semibold text-foreground">
                            Duration:
                          </span>{" "}
                          {videoResult.seconds ?? "8"} sec
                        </p>
                        <p>
                          <span className="font-semibold text-foreground">
                            Resolution:
                          </span>{" "}
                          {videoResult.size ?? "720x1280"}
                        </p>
                      </div>
                      <a
                        className="text-sm text-primary underline"
                        href={videoResult.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open {activeProviderLabel} video file
                      </a>
                      {videoResult.captions && (
                        <div className="mt-4 space-y-3">
                          <h4 className="font-semibold text-foreground">
                            Viral Captions
                          </h4>
                          <div className="space-y-2 text-sm text-muted-foreground">
                            {videoResult.captions.instagram && (
                              <div>
                                <span className="font-semibold text-foreground">
                                  Instagram:
                                </span>{" "}
                                {videoResult.captions.instagram}
                              </div>
                            )}
                            {videoResult.captions.tiktok && (
                              <div>
                                <span className="font-semibold text-foreground">
                                  TikTok:
                                </span>{" "}
                                {videoResult.captions.tiktok}
                              </div>
                            )}
                            {videoResult.captions.facebook && (
                              <div>
                                <span className="font-semibold text-foreground">
                                  Facebook:
                                </span>{" "}
                                {videoResult.captions.facebook}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {videoResult.hashtags && videoResult.hashtags.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-semibold text-foreground mb-1">
                            Smart Hashtags
                          </h4>
                          <div className="flex flex-wrap gap-2 text-sm">
                            {videoResult.hashtags.map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 rounded-full bg-secondary/20 text-secondary-foreground text-xs"
                              >
                                {tag.startsWith("#") ? tag : `#${tag}`}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Generated videos will appear here once ready. Provide a
                      great bio and photo to unlock the best results!
                    </div>
                  )}
                </CardContent>
              </Card>
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
