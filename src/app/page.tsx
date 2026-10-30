"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { HomeCanvas } from "@/components/HomeCanvas";
import { MockDataProvider } from "@/store/MockDataContext";
import { LoginScreen } from "@/components/LoginScreen";
import { AgrasyaLogo } from "@/components/AgrasyaLogo";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-agrasya-bg flex flex-col items-center justify-center gap-4">
        <AgrasyaLogo size={54} variant="badge" glow className="animate-pulse" />
        <div className="flex items-center gap-2 text-xs font-sans text-agrasya-muted uppercase tracking-widest font-semibold">
          <Loader2 className="animate-spin text-agrasya-green" size={14} />
          <span>Decrypting Founder OS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <MockDataProvider>
      <main className="min-h-screen bg-agrasya-bg selection:bg-agrasya-green/20">
        <HomeCanvas />
      </main>
    </MockDataProvider>
  );
}
