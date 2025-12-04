import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbconnect";
import CertificateRequest from "@/models/CertificateRequest";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const certId = searchParams.get("certId");
    const action = searchParams.get("action");

    if (!certId) {
      return NextResponse.json({ success: false, message: "Missing ID" }, { status: 400 });
    }

    await dbConnect();

    // UPDATE MONGODB
    await CertificateRequest.findOneAndUpdate(
      { certificateId: certId },
      { status: action === 'approve' },
      { new: true, upsert: true }
    );

    // RETURN AUTO-CLOSING PAGE
    return new NextResponse(
      `<html>
        <body style="background-color: #f0fdf4; display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">
          <div style="text-align: center; padding: 40px; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h1 style="color: ${action === 'approve' ? '#16a34a' : '#dc2626'};">
              ${action === 'approve' ? '✅ APPROVED' : '❌ REJECTED'}
            </h1>
            <p>Database updated.</p>
            <p style="font-size: 12px; color: #888;">Closing window...</p>
            <script>
                // Close the window automatically after 1.5 seconds
                setTimeout(() => window.close(), 1500);
            </script>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" } }
    );

  } catch (error) {
    return NextResponse.json({ success: false, message: "Error" }, { status: 500 });
  }
}