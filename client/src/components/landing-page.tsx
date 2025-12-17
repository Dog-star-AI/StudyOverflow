import { GraduationCap, MessageSquare, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">StudyOverflow</span>
          </div>
          <Button asChild data-testid="button-login-header">
            <a href="/api/login">Sign In</a>
          </Button>
        </div>
      </header>

      <main>
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6" data-testid="text-hero-title">
              Share Problems.<br />Find Solutions.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="text-hero-subtitle">
              StudyOverflow connects students across universities to help each other tackle academic challenges. 
              Ask questions, share solutions, and learn together.
            </p>
            <Button size="lg" asChild data-testid="button-get-started">
              <a href="/api/login">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>

        <section className="py-16 px-4 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-12">Why Students Love StudyOverflow</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-none bg-background">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Ask Anything</h3>
                  <p className="text-muted-foreground">
                    Post your questions organized by university and course. Get answers from peers who've been there.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none bg-background">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-chart-2/10 text-chart-2 mb-4">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Verified Solutions</h3>
                  <p className="text-muted-foreground">
                    Upvote the best answers. Mark solutions as accepted. Find what actually works.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-none bg-background">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-full bg-chart-3/10 text-chart-3 mb-4">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">Build Reputation</h3>
                  <p className="text-muted-foreground">
                    Earn recognition for helping others. Build your academic profile and connect with peers.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to get help with your studies?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of students already helping each other succeed.
            </p>
            <Button size="lg" asChild data-testid="button-join-now">
              <a href="/api/login">
                Join Now - It's Free
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          <p>StudyOverflow - Helping students help each other</p>
        </div>
      </footer>
    </div>
  );
}
