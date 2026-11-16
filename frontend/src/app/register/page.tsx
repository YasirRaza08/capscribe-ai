"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // 100% Free - No registration required, direct access to studio
    router.replace("/dashboard");
  }, [router]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 text-center">
      <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-4" />
      <h2 className="text-xl font-bold text-white">Opening CapScribe Studio...</h2>
      <p className="text-xs text-gray-400 mt-2">No sign up needed — full free access enabled!</p>
    </div>
  );
}
