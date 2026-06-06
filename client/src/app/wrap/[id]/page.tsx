"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import WrapCard from "../../components/WrapCard";
import { getWrap } from "../../lib/api";

export default function WrapPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      getWrap(params.id as string)
        .then(setData)
        .catch(() => setData(null))
        .finally(() => setLoading(false));
    }
  }, [params?.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-white/50 animate-pulse">Loading DNA Wrap...</div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-white/30">Wrap not found.</div>
      </main>
    );
  }

  const shareUrl = `${window.location.origin}/wrap/${data.wrap_id}`;

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Song DNA
          </h1>
          <p className="text-white/40 text-sm mt-1">DNA Wrap</p>
        </div>
        <WrapCard data={data} shareUrl={shareUrl} />
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-white/40 hover:text-white text-sm transition-colors"
          >
            Create your own DNA Wrap
          </Link>
        </div>
      </div>
    </main>
  );
}