"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { HomeCanvas } from "@/components/HomeCanvas";
import { MockDataProvider } from "@/store/MockDataContext";
import { LoginScreen } from "@/components/LoginScreen";
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
      <div className="min-h-screen bg-agrasya-bg flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-agrasya-green mb-4" size={32} />
        <div className="text-sm font-sans text-agrasya-muted uppercase tracking-widest font-medium animate-pulse">
          Decrypting OS...
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
