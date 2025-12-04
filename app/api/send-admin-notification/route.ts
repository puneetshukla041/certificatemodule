import { NextResponse } from "next/server";
import sgMail from "@sendgrid/mail";
import dbConnect from "@/lib/dbconnect"; 
import CertificateRequest from "@/models/CertificateRequest";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, subject, text, certificateId, certificateNo } = body;

    if (!to || !certificateId) {
      return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
    }

    await dbConnect();

    // Create the Pending Request
    await CertificateRequest.findOneAndUpdate(
      { certificateId: certificateId },
      { 
        certificateNo: certificateNo,
        $setOnInsert: { status: false } 
      },
      { upsert: true, new: true }
    );

    // 🚨 FIX: FORCE REAL DOMAIN GENERATION
    // If running on Vercel, use the Vercel URL. If local, use localhost.
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    
    // If the ENV variable is missing or localhost, try to detect Vercel
    if (!baseUrl || baseUrl.includes('localhost')) {
        if (process.env.VERCEL_URL) {
            baseUrl = `https://${process.env.VERCEL_URL}`;
        } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
             baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
        } else {
             // Fallback for local testing only
             baseUrl = "http://localhost:3000";
        }
    }

    // These links trigger the API to update MongoDB
    const approveLink = `${baseUrl}/api/approve-request?certId=${certificateId}&action=approve`;
    const rejectLink = `${baseUrl}/api/approve-request?certId=${certificateId}&action=reject`;

    sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

    const msg = {
      to: to,
      from: "puneetshukla041@gmail.com",
      subject: subject,
      text: text,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #d9534f;">🔒 Approval Required</h2>
          <pre style="background: #f9f9f9; padding: 10px;">${text}</pre>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${approveLink}" style="background-color: #16a34a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 20px;">
               ✅ APPROVE
            </a>
            <a href="${rejectLink}" style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
               ❌ REJECT
            </a>
          </div>
        </div>
      `,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true, message: "Request sent." });

  } catch (error: any) {
    console.error("Admin Notify Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}