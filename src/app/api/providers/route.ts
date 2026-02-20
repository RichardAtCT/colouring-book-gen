import { NextResponse } from "next/server";
import type { Provider } from "@/lib/generate-image";

export interface ProvidersResponse {
  providers: Provider[];
}

export function GET() {
  const providers: Provider[] = [];

  if (process.env.OPENAI_API_KEY) {
    providers.push("openai");
  }
  if (process.env.GEMINI_API_KEY) {
    providers.push("gemini");
  }

  return NextResponse.json<ProvidersResponse>({ providers });
}
