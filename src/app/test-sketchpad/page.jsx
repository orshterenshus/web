import React from 'react';
import SketchPad from '../../components/SketchPad';

export default function TestSketchPad() {
    return (
        <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">SketchPad Component Test</h1>

            <div className="w-full max-w-4xl h-[600px] border border-gray-300 rounded-xl shadow-lg bg-white overflow-hidden">
                <SketchPad />
            </div>

            <div className="mt-8 text-gray-600 max-w-2xl text-center">
                <p>Instructions: Draw inside the box above. Test changing colors, brush size, undoing strokes, and clearing the canvas.</p>
                <p className="mt-2 text-sm">Note: This is a standalone test page.</p>
            </div>
        </div>
    );
}
