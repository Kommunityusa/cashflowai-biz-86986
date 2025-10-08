import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GuestAccountCreation } from "@/components/GuestAccountCreation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function SetupAccount() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email");
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    // If no email or session ID, redirect to home
    if (!email || !sessionId) {
      navigate("/");
    }
  }, [email, sessionId, navigate]);

  if (!email || !sessionId) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <div className="w-full max-w-2xl space-y-6">
        <Card className="border-success/20">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
            </div>
            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
            <CardDescription>
              Thank you for subscribing to Cash Flow AI Pro. Complete your account setup below.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuestAccountCreation email={email} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
