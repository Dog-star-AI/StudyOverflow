import { useState, type FormEvent } from "react";
import { GraduationCap, MessageSquare, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [codeStatus, setCodeStatus] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSendCode() {
    setCodeStatus(null);
    setError(null);
    if (!email) {
      setCodeStatus("Enter your email first so we can send the code.");
      return;
    }

    try {
      setSendingCode(true);
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || "Unable to send verification code");
      }

      setCodeStatus(
        body.previewCode
          ? `Code sent. Use ${body.previewCode} within 10 minutes (dev preview).`
          : body.message || "Verification code sent."
      );
    } catch (err) {
      setCodeStatus(err instanceof Error ? err.message : "Unable to send verification code");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim(),
          password,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          verificationCode: verificationCode.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message || "Unable to sign in");
      }

      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in");
    } finally {
      setSubmitting(false);
    }
  }

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
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" asChild data-testid="button-login-header">
              <a href="#login">Sign In</a>
            </Button>
          </div>
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
              <a href="#login">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </div>
          <div id="login" className="max-w-xl mx-auto mt-12">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-1 text-left">
                  <h2 className="text-xl font-semibold">Sign in or create an account</h2>
                  <p className="text-sm text-muted-foreground">
                    Use your email and a password to join securely. Your details are stored on the server and kept private to your account.
                  </p>
                </div>
                <form className="space-y-4 text-left" onSubmit={handleSubmit}>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First name (optional)</Label>
                      <Input
                        id="firstName"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last name (optional)</Label>
                      <Input
                        id="lastName"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <Label htmlFor="verificationCode">Verification code</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSendCode}
                        disabled={sendingCode || !email}
                        data-testid="button-send-code"
                      >
                        {sendingCode ? "Sending..." : "Send code"}
                      </Button>
                    </div>
                    <Input
                      id="verificationCode"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="6-digit code"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      New accounts require a verification code. Existing members can sign in as usual.
                    </p>
                    {codeStatus && <p className="text-sm text-primary">{codeStatus}</p>}
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={submitting} data-testid="button-join-now">
                    {submitting ? "Signing in..." : "Join Now - It's Free"}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </form>
              </CardContent>
            </Card>
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
            <Button size="lg" asChild>
              <a href="#login">
                Start Learning Together
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
