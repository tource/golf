import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-auth";
import { parseScoreImages } from "@/lib/utils/score-image-parse";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) {
    return NextResponse.json({ error }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY가 설정되지 않았습니다." },
      { status: 400 },
    );
  }

  try {
    const form = await request.formData();
    const fromMulti = form.getAll("images").filter((f) => f instanceof File);
    const single = form.get("image");
    const files: File[] =
      fromMulti.length > 0
        ? (fromMulti as File[])
        : single instanceof File
          ? [single]
          : [];

    if (files.length === 0) {
      return NextResponse.json(
        { error: "이미지 파일을 선택해 주세요." },
        { status: 400 },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `한 번에 최대 ${MAX_FILES}장까지 업로드할 수 있습니다.` },
        { status: 400 },
      );
    }

    const parsed: { buffer: Buffer; mimeType: string }[] = [];

    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        return NextResponse.json(
          { error: "PNG, JPG, WEBP 이미지만 지원합니다." },
          { status: 400 },
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: "각 이미지는 8MB 이하만 가능합니다." },
          { status: 400 },
        );
      }
      parsed.push({
        buffer: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type,
      });
    }

    const result = await parseScoreImages(parsed);

    return NextResponse.json({
      ...result,
      imageCount: files.length,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "분석 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
