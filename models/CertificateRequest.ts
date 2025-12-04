// models/CertificateRequest.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICertificateRequest extends Document {
  certificateId: mongoose.Types.ObjectId;
  certificateNo: string;
  requesterIp?: string; // Optional: to track who asked
  status: boolean; // false = Pending, true = Approved
  createdAt: Date;
  updatedAt: Date;
}

const CertificateRequestSchema: Schema = new Schema(
  {
    certificateId: { type: mongoose.Schema.Types.ObjectId, ref: "Certificate", required: true },
    certificateNo: { type: String, required: true },
    status: { type: Boolean, default: false }, // Default is LOCKED (false)
  },
  { timestamps: true }
);

// Prevent duplicate pending requests for the same certificate
CertificateRequestSchema.index({ certificateId: 1 }, { unique: true });

const CertificateRequest: Model<ICertificateRequest> =
  mongoose.models.CertificateRequest || mongoose.model<ICertificateRequest>("CertificateRequest", CertificateRequestSchema);

export default CertificateRequest;