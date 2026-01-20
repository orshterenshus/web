"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

/**
 * SketchPad Component
 *
 * A lightweight drawing canvas for low-fidelity prototyping.
 * Features:
 * - Freehand drawing (Mouse & Touch)
 * - Adjustable brush size & color
 * - Undo functionality
 * - Clear canvas
 * - Export to PNG
 * - Responsive sizing
 */
const SketchPad = ({
  initialColor = "#ffffff",
  initialBrushSize = 3,
  onSave, // Optional callback if parent wants to handle save
}) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(initialColor);
  const [brushSize, setBrushSize] = useState(initialBrushSize);
  const [history, setHistory] = useState([]);
  const [showGrid, setShowGrid] = useState(false);
  const [tool, setTool] = useState("pen"); // "pen" or "eraser"

  // Initialize canvas size
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        // Save current content before resizing to avoid loss
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = canvasRef.current.width;
        tempCanvas.height = canvasRef.current.height;
        tempCtx.drawImage(canvasRef.current, 0, 0);

        // Resize
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        // Restore content (optional, or just clear. Let's clear for simplicity on drastic resize but try to keep if possible)
        // For a simple prototype tool, clearing or simple scaling might be acceptable,
        // but let's just re-render the history if we wanted to be perfect.
        // For now: Just resize. The user can clear or undo.
        // Re-applying context settings
        const context = canvasRef.current.getContext("2d");
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = color;
        context.lineWidth = brushSize;
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Run once on mount, but we also need to update context when color/size change

  // Handle Theme Change & Color Inversion
  useEffect(() => {
    const handleThemeInversion = (isDark) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;

      // 1. Get current pixels
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;

      // 2. Invert Black <-> White
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip transparent pixels
        if (a === 0) continue;

        // Check for Black (or very dark) -> Change to White
        if (r < 50 && g < 50 && b < 50) {
          data[i] = 255;     // R
          data[i + 1] = 255; // G
          data[i + 2] = 255; // B
        }
        // Check for White (or very bright) -> Change to Black
        else if (r > 200 && g > 200 && b > 200) {
          data[i] = 0;       // R
          data[i + 1] = 0;   // G
          data[i + 2] = 0;   // B
        }
        // Other colors remain unchanged
      }

      // 3. Put back inverted pixels
      ctx.putImageData(imageData, 0, 0);

      // 4. Update Brush Color preference
      // If we switched to Dark, we probably want White pen.
      // If we switched to Light, we probably want Black pen.
      setColor(prevColor => {
        if (isDark && (prevColor === '#000000' || prevColor === '#020617')) return '#ffffff';
        if (!isDark && (prevColor === '#ffffff')) return '#000000';
        return prevColor; // Keep other colors (red, blue, etc.)
      });
    };

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "attributes" && mutation.attributeName === "data-theme") {
          const isDark = document.documentElement.getAttribute("data-theme") === "dark";
          handleThemeInversion(isDark);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    // Run once on mount to align with initial state if needed? 
    // Actually no, we only want to invert ON CHANGE. Initial state should be handled by default props or user.

    return () => observer.disconnect();
  }, [tool]); // Re-run if tool changes? No. The logic is independent of tool. Empty dependency or minimal.

  // Update context context when state changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      context.lineCap = "round";
      context.lineJoin = "round";

      if (tool === "eraser") {
        context.globalCompositeOperation = "destination-out";
        context.lineWidth = brushSize * 2; // Eraser is typically larger
      } else {
        context.globalCompositeOperation = "source-over";
        context.strokeStyle = color;
        context.lineWidth = brushSize;
      }
    }
  }, [color, brushSize, tool]);

  // Save state to history for Undo
  const savehHistory = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setHistory((prev) => [
        ...prev.slice(-19), // Keep last 20 states
        canvas.toDataURL(),
      ]);
    }
  };

  const getCoordinates = (event) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();

    // Handle Touch
    if (event.touches && event.touches[0]) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top,
      };
    }
    // Handle Mouse
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault(); // Prevent scrolling on touch
    savehHistory(); // Save state before new stroke
    const { x, y } = getCoordinates(e);
    const context = canvasRef.current.getContext("2d");
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const context = canvasRef.current.getContext("2d");
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    const context = canvasRef.current.getContext("2d");
    context.closePath();
    setIsDrawing(false);
  };

  const undo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const lastState = history[history.length - 1];

    // Create an image to restore
    const img = new Image();
    img.src = lastState;
    img.onload = () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, 0, 0);
    };

    // If we are at the very first state (blank), handling might be needed,
    // but here we just pop the last state which was "before the last stroke".
    // Wait, if we save before stroke, popping restores "before".
    // We actually need to pop from history and set canvas to that.
    // If we undo, we should remove the last state from history?
    // standard undo:
    // history = [state0, state1, state2]
    // current = state3 (not in history implicitly, or is it?)
    // Simple approach: history stores snapshots.
    // Pop last snapshot -> restore it -> remove from history? No, that loses it.
    // Usually:
    // push current state to undoStack.
    // undo: pop from undoStack -> draw -> push to redoStack (if implemented).

    // Let's refine:
    // saveHistory is called BEFORE drawing. So history contains state just before the stroke.
    // So to undo: we take the last item, draw it, and remove it from history.

    const newHistory = [...history];
    const previousStateUrl = newHistory.pop();
    setHistory(newHistory);

    if (previousStateUrl) { // if history wasn't empty
      const restoreImg = new Image();
      restoreImg.src = previousStateUrl;
      restoreImg.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(restoreImg, 0, 0);
      }
    } else {
      // History empty implies canvas was blank (or initial state)
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const clearCanvas = () => {
    savehHistory();
    const context = canvasRef.current.getContext("2d");
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");

    // If parent provided onSave, use it
    if (onSave) {
      onSave(dataUrl);
      return;
    }

    // Default download behavior
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "prototype-sketch.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full w-full glass-panel rounded-xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-[var(--card-bg)] border-b border-[var(--glass-border)] backdrop-blur-md">

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <label title="Brush Color" className="cursor-pointer flex items-center gap-1">
            <div className="w-6 h-6 rounded-full border border-[var(--border-interactive)] shadow-sm" style={{ backgroundColor: color }}></div>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="sr-only" // Hidden input, triggered by label
            />
          </label>
        </div>

        {/* Brush Size */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] uppercase font-bold">Size</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 h-1 bg-[var(--input-bg)] rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className="h-6 w-px bg-[var(--glass-border)] mx-2 hidden sm:block"></div>

        {/* Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTool("pen")}
            className={`p-2 rounded-lg transition-all ${tool === "pen" ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/50 shadow-sm' : 'hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
            title="Pen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
              <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
              <path d="M2 2l7.586 7.586"></path>
              <circle cx="11" cy="11" r="2"></circle>
            </svg>
          </button>
          <button
            onClick={() => setTool("eraser")}
            className={`p-2 rounded-lg transition-all ${tool === "eraser" ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-500/50 shadow-sm' : 'hover:bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--foreground)]'}`}
            title="Eraser"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path>
              <path d="M17 17L7 7"></path>
            </svg>
          </button>
        </div>

        <div className="h-6 w-px bg-[var(--glass-border)] mx-2 hidden sm:block"></div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className={`p-2 rounded-lg hover:bg-[var(--input-bg)] transition-colors text-[var(--text-muted)] ${history.length === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-[var(--foreground)]'}`}
            title="Undo"
          >
            {/* Simple Undo Icon SVG */}
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-2 rounded-lg hover:bg-[var(--input-bg)] transition-colors text-[var(--text-muted)] ${showGrid ? 'bg-[var(--input-bg)] text-[var(--foreground)]' : ''}`}
            title="Toggle Grid"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>

          <button
            onClick={clearCanvas}
            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-red-500 hover:text-red-600"
            title="Clear Canvas"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>

        <div className="ml-auto">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-all shadow-lg shadow-indigo-500/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Save
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative cursor-crosshair touch-none bg-[var(--bg-primary)]"
        style={{
          backgroundImage: showGrid ? 'radial-gradient(rgba(100,116,139,0.3) 1px, transparent 1px)' : 'none',
          backgroundSize: '20px 20px'
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="absolute top-0 left-0 w-full h-full block"
        />
      </div>
    </div>
  );
};

export default SketchPad;
