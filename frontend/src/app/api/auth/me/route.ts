import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    id: "dev-user-001",
    email: "creator@capscribe.ai",
    full_name: "Lead Creator",
    plan: "pro",
    credits_remaining: 500,
    storage_used_mb: 24.5,
    total_projects: 12
  });
}
