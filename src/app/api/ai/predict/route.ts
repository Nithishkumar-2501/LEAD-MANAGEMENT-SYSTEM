import { NextResponse } from "next/server";
import { predictStudentConversion, calculateTneaCutoff, StudentPredictionInput } from "@/lib/ai/leadScoringEngine";
import modelData from "@/lib/ai/leadPredictorModel.json";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = predictStudentConversion(body as StudentPredictionInput);
    return NextResponse.json({
      success: true,
      prediction: result,
      modelMetadata: {
        modelName: modelData.model_name,
        accuracy: modelData.metrics.accuracy,
        rocAuc: modelData.metrics.roc_auc,
        version: modelData.version,
      },
    });
  } catch (error: any) {
    console.error("AI Prediction Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to run ML prediction" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    modelName: modelData.model_name,
    version: modelData.version,
    metrics: modelData.metrics,
    featureImportances: modelData.feature_importances,
  });
}
