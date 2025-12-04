// app/api/certificates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbconnect';
import Certificate, { ICertificate } from '@/models/Certificate';
import CertificateRequest from '@/models/CertificateRequest'; // 💡 Import the new model

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const connection = await dbConnect();
        if (!connection) {
            return NextResponse.json({ success: false, message: 'Database connection failed.' }, { status: 500 });
        }
        
        const { searchParams } = new URL(req.url);
        const isExport = searchParams.get('all') === 'true';
        
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '10', 10);
        const query = searchParams.get('q') || '';
        const hospitalFilter = searchParams.get('hospital') || '';

        const skip = isExport ? 0 : (page - 1) * limit;
        const queryLimit = isExport ? 0 : limit;

        const dbQuery: any = {};

        if (query) {
            const searchRegex = new RegExp(query, 'i');
            dbQuery.$or = [
                { certificateNo: { $regex: searchRegex } },
                { name: { $regex: searchRegex } },
                { hospital: { $regex: searchRegex } },
                { doi: { $regex: searchRegex } },
            ];
        }

        if (hospitalFilter) {
            dbQuery.hospital = hospitalFilter;
        }

        // 1. Fetch filtered results (Raw Certificates)
        let certificatesQuery = Certificate.find(dbQuery).lean();
            
        if (queryLimit > 0) {
            certificatesQuery = certificatesQuery.limit(queryLimit).skip(skip);
        }

        // Execute main query and auxiliary queries in parallel
        const [rawCertificates, totalCount, uniqueHospitals] = await Promise.all([
            certificatesQuery.exec(),
            Certificate.countDocuments(dbQuery),
            Certificate.distinct('hospital')
        ]);

        // 💡 2. Fetch Approval Statuses
        // Get all IDs from the fetched certificates
        // @ts-ignore
        const certIds = rawCertificates.map(c => c._id);
        
        // Find requests matching these IDs
        const requests = await CertificateRequest.find({ certificateId: { $in: certIds } }).lean();

        // 💡 3. Merge Status into Data
        const dataWithStatus = rawCertificates.map((cert: any) => {
            // Find if there is a request record for this certificate
            const req = requests.find(r => r.certificateId.toString() === cert._id.toString());
            
            return {
                ...cert,
                // If a request exists, use its status (true/false). If no request exists, default to false.
                isApproved: req ? req.status : false
            };
        });

        return NextResponse.json({
            success: true,
            data: dataWithStatus, // Return merged data
            total: totalCount,
            page,
            limit: queryLimit || totalCount,
            totalPages: Math.ceil(totalCount / limit),
            filters: { hospitals: uniqueHospitals.filter((h: string) => h) },
        }, { status: 200 });

    } catch (error) {
        console.error('Fetch error:', error);
        return NextResponse.json({ success: false, message: 'Error fetching certificates.' }, { status: 500 });
    }
}

// ... POST handler remains the same ...
export async function POST(req: NextRequest) {
    try {
        const connection = await dbConnect();
        if (!connection) {
            return NextResponse.json({ success: false, message: 'Database connection failed.' }, { status: 500 });
        }

        const body: ICertificate = await req.json();

        if (!body.certificateNo || !body.name || !body.hospital || !body.doi) {
            return NextResponse.json({ success: false, message: 'Validation Error: Missing required fields.' }, { status: 400 });
        }
        if (!/^\d{2}-\d{2}-\d{4}$/.test(body.doi)) {
            return NextResponse.json({ success: false, message: 'Validation Error: DOI must be in DD-MM-YYYY format.' }, { status: 400 });
        }

        const newCertificate = await Certificate.create(body);

        return NextResponse.json({ success: true, data: newCertificate.toObject() }, { status: 201 });

    } catch (error: any) {
        console.error('Creation error:', error);
        if (error.code === 11000) {
            return NextResponse.json({ success: false, message: 'Creation failed: Certificate No. must be unique.' }, { status: 400 });
        }
        return NextResponse.json({ success: false, message: 'Server error during certificate creation.' }, { status: 500 });
    }
}