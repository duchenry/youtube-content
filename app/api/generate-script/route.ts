import { NextResponse } from "next/server";
import { generateFullScript } from "@/app/lib/services/scriptGenerator";
import { supabase } from "@/app/lib/supabase";

export async function POST(req: Request) {
  let analysisId: string | null = null;
  
  try {
    const body = await req.json();
    
    const data = body.data ?? body;
    const id = body.id;
    
    if (!data) throw new Error("Missing data");

    // ✅ reuse nếu có id
    if (id) {
      analysisId = id;

      const { error } = await supabase
        .from("analyses")
        .update({
          result: data,
          status: "PROCESSING",
        })
        .eq("id", analysisId);
        
        if (error) throw error;
      } else {
        // ✅ create nếu chưa có
        const { data: row, error } = await supabase
        .from("analyses")
        .insert({
          result: data,
          status: "PROCESSING",
        })
        .select()
        .single();

      if (error) throw error;

      analysisId = row.id;
    }

    if (!analysisId) throw new Error("No analysisId");

    // ✅ generate
    const result = await generateFullScript(data, analysisId);
    // ✅ save
    const { error: updateError } = await supabase
      .from("analyses")
      .update({
        generated_script: result,
        status: "FINAL",
      })
      .eq("id", analysisId);

    if (updateError) throw updateError;

    return NextResponse.json({
      result,
      id: analysisId,
    });

  } catch (err: any) {
    console.error(err);

    if (analysisId) {
      await supabase
        .from("analyses")
        .update({ status: "ERROR" })
        .eq("id", analysisId);
    }

    return NextResponse.json(
      { error: err.message || "Error" },
      { status: 500 }
    );
  }
}