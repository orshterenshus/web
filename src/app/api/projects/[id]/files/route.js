import dbConnect from '@/utils/db';
import Project from '@/models/Project';
import cloudinary from '@/utils/cloudinary';
import { NextResponse } from 'next/server';

// GET - Fetch all files for a project
export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const project = await Project.findById(id).select('files');

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({ files: project.files || [] });
    } catch (error) {
        console.error('Error fetching files:', error);
        return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }
}

// POST - Upload a new file
export async function POST(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const formData = await request.formData();
        const file = formData.get('file');
        const uploadedBy = formData.get('uploadedBy') || 'Unknown';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64File = `data:${file.type};base64,${buffer.toString('base64')}`;

        // Determine file type for Cloudinary
        let resourceType = 'auto';
        let fileType = 'other';

        if (file.type.startsWith('image/')) {
            resourceType = 'image';
            fileType = 'image';
        } else if (file.type === 'application/pdf') {
            resourceType = 'raw';
            fileType = 'pdf';
        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
            resourceType = 'raw';
            fileType = 'text';
        } else {
            resourceType = 'raw';
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(base64File, {
            folder: `designbot/projects/${id}`,
            resource_type: resourceType,
            public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        });

        // Create file metadata
        const fileData = {
            name: file.name,
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            fileType: fileType,
            size: file.size,
            uploadedAt: new Date(),
            uploadedBy: uploadedBy
        };

        // Add file to project
        const project = await Project.findByIdAndUpdate(
            id,
            { $push: { files: fileData } },
            { new: true }
        );

        if (!project) {
            // If project not found, delete the uploaded file from Cloudinary
            await cloudinary.uploader.destroy(uploadResult.public_id, { resource_type: resourceType });
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({
            message: 'File uploaded successfully',
            file: fileData
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return NextResponse.json({ error: 'Failed to upload file: ' + error.message }, { status: 500 });
    }
}

// DELETE - Remove a file
export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const publicId = searchParams.get('publicId');

        if (!publicId) {
            return NextResponse.json({ error: 'Public ID required' }, { status: 400 });
        }

        // Find the file in the project to get resource type
        const project = await Project.findById(id);
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        const fileToDelete = project.files.find(f => f.publicId === publicId);
        if (!fileToDelete) {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Determine resource type for deletion
        let resourceType = 'image';
        if (fileToDelete.fileType === 'pdf' || fileToDelete.fileType === 'text' || fileToDelete.fileType === 'other') {
            resourceType = 'raw';
        }

        // Delete from Cloudinary
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });

        // Remove file from project
        await Project.findByIdAndUpdate(
            id,
            { $pull: { files: { publicId: publicId } } }
        );

        return NextResponse.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
}
