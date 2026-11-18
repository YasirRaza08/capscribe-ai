import { NextResponse } from "next/server";
import { CAPTION_TEMPLATES } from "@/lib/presets";

export async function GET() {
  return NextResponse.json(CAPTION_TEMPLATES);
}
