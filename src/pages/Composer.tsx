import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, Video, Share2, Loader2, Music2, Film } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  createStory,
  createVoiceover,
  ingestMedia,
  renderVideo,
  resolveMediaUrl,
  suggestDomains,
  type DomainSuggestion,
  type StoryResponse,
} from "@/lib/api";

type StepKey = "upload" | "story" | "voice" | "render" | "domains";

const STEP_LABELS: Record<StepKey, string> = {
  upload: "Uploading the pet photo to storage",
  story: "Crafting scripts, hooks, and hashtags",
  voice: "Generating the ElevenLabs narration",
  render: "Stitching the captions into a vertical video",
  domains: "Scoring memorable domain names",
};

interface CampaignResult {
  story: StoryResponse;
  voiceUrl?: string;
  videoUrl?: string;
  mediaUrl: string;
  domains: DomainSuggestion[];
}

const Composer = () => {
  const [petName, setPetName] = useState("");
  const [petBio, setPetBio] = useState("");
  const [petLocation, setPetLocation] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepKey | null>(null);
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  const disabled = !petName || !petBio || !imageFile || isGenerating;

  const keywordHints = useMemo(() => {
    return petBio
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 3);
  }, [petBio]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile || !petName || !petBio) return;
    setIsGenerating(true);
    setCurrentStep("upload");
    setErrorMessage(null);
    setResult(null);

    try {
      const upload = await ingestMedia(imageFile);

      setCurrentStep("story");
      const story = await createStory({
        pet_name: petName,
        bio: petBio,
        traits: [],
        image_url: upload.media_url,
      });

      setCurrentStep("voice");
      const voice = await createVoiceover({ script: story.script });
      const voiceUrl = resolveMediaUrl(voice.url ?? voice.local_path ?? "");

      setCurrentStep("render");
      const render = await renderVideo({
        pet_name: petName,
        script: story.script,
        captions: story.caption_variants.length ? story.caption_variants : [story.script],
        media_url: upload.media_url,
        voiceover_url: voiceUrl ? voiceUrl : undefined,
      });
      const videoUrl = resolveMediaUrl(render.video_url ?? "");

      setCurrentStep("domains");
      const domains = await suggestDomains({
        pet_name: petName,
        location: petLocation || undefined,
        keywords: keywordHints,
      });

      setResult({
        story,
        voiceUrl,
        videoUrl,
        mediaUrl: resolveMediaUrl(upload.media_url),
        domains: domains.suggestions,
      });

      toast({
        title: "Campaign ready! 🐾",
        description: "Story, voiceover, and render are synced below.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      setErrorMessage(message);
      toast({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep(null);
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
                  <Label htmlFor="pet-location">Shelter Location (optional)</Label>
                  <Input
                    id="pet-location"
                    placeholder="Buffalo, NY"
                    value={petLocation}
                    onChange={(e) => setPetLocation(e.target.value)}
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
                  disabled={disabled}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Campaign
                    </>
                  )}
                </Button>

                {currentStep && (
                  <Alert className="mt-4">
                    <AlertTitle>Working on it…</AlertTitle>
                    <AlertDescription>{STEP_LABELS[currentStep]}</AlertDescription>
                  </Alert>
                )}

                {errorMessage && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertTitle>Heads up</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
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

              {result && (
                <Card className="animate-fade-in border-primary/30 shadow-lg shadow-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Sparkles className="h-5 w-5" />
                      Campaign Output
                    </CardTitle>
                    <CardDescription>
                      Ready-to-publish assets for {result.story.pet_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <section>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Video className="h-4 w-4 text-primary" />
                        Script & Hooks
                      </h4>
                      <p className="text-sm bg-muted/60 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                        {result.story.script}
                      </p>
                      <div className="mt-3 space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Hooks</p>
                        <ul className="list-disc list-inside text-sm text-foreground">
                          {result.story.hook_variants.map((hook) => (
                            <li key={hook}>{hook}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Captions</p>
                        <ul className="list-disc list-inside text-sm text-foreground">
                          {result.story.caption_variants.map((caption) => (
                            <li key={caption}>{caption}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {result.story.hashtags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </section>

                    {result.story.provider_results?.length > 0 && (
                      <section>
                        <h4 className="font-semibold mb-2">Model Benchmarks</h4>
                        <div className="space-y-2">
                          {result.story.provider_results.map((provider) => (
                            <div
                              key={provider.model}
                              className="flex items-center justify-between text-sm rounded-md border border-border/60 px-3 py-2"
                            >
                              <span className="font-medium">{provider.model}</span>
                              <span className="text-muted-foreground">
                                {provider.latency_ms}ms · ${provider.cost_usd.toFixed(4)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <Separator />

                    <section className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Music2 className="h-4 w-4 text-primary" />
                        Voiceover Preview
                      </h4>
                      {result.voiceUrl ? (
                        <audio controls src={result.voiceUrl} className="w-full" />
                      ) : (
                        <p className="text-sm text-muted-foreground">Voiceover unavailable.</p>
                      )}
                    </section>

                    <section className="space-y-2">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Film className="h-4 w-4 text-primary" />
                        Rendered Video
                      </h4>
                      {result.videoUrl ? (
                        <video
                          controls
                          src={result.videoUrl}
                          className="w-full rounded-lg border border-border/60"
                          loop
                          playsInline
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground">Video render pending.</p>
                      )}
                    </section>

                    <Separator />

                    <section>
                      <h4 className="font-semibold mb-2">Domain Ideas</h4>
                      <div className="space-y-2">
                        {result.domains.map((domain) => (
                          <div
                            key={domain.domain}
                            className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2 text-sm"
                          >
                            <span className="font-medium">{domain.domain}</span>
                            <span className="text-muted-foreground">{Math.round(domain.score * 100)}%</span>
                          </div>
                        ))}
                      </div>
                    </section>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Composer;
