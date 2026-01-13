import dbConnect from '@/utils/db';
import Ideation from '@/models/Ideation';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { projectId } = await params;
        const data = await Ideation.findOne({ projectId });
        return NextResponse.json(data || {});
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    try {
        await dbConnect();
        const { projectId } = await params;
        const body = await request.json();
        const { brainstorming, matrix, specs } = body; // Destructure expected fields

        const updated = await Ideation.findOneAndUpdate(
            { projectId },
            {
                $set: { brainstorming, matrix, specs }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        console.log("✅ Ideation Saved for:", projectId);
        return NextResponse.json(updated);
    } catch (err) {
        console.error("❌ Save Failed:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
