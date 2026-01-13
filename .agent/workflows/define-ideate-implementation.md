---
description: Implementation plan for Define & Ideate phases
---

# Design Thinking Bot: Define & Ideate Phase Implementation Plan

## Overview
This plan outlines the step-by-step implementation to transform the current checklist-based UI into an interactive AI-assisted workspace for the Define and Ideate stages.

## Phase 1: DEFINE Components

### 1.1 Persona Context Widget
- **Location**: Top bar of project workspace
- **Component**: `src/components/PersonaContextWidget.jsx`
- **Features**:
  - Display persona image, name, and core pain point
  - Persistent across all views
  - Collapsible for space management
  - Data inherited from Empathize phase

### 1.2 POV & HMW Builder
- **Component**: `src/components/POVBuilder.jsx`
- **Features**:
  - Mad-libs style form with three fields:
    - Persona Name (auto-filled from Empathize)
    - User Need (text input)
    - Insight/Root Cause (text input)
  - AI-generated HMW questions (3-5) on completion
  - Save POV to project database
  - Rich text editing capabilities

### 1.3 Reality Board (Constraints & KPIs)
- **Component**: `src/components/RealityBoard.jsx`
- **Features**:
  - Three sections:
    - Technical Constraints (tags/chips input)
    - Business Constraints (tags/chips input)
    - Success Metrics/KPIs (key-value pairs)
  - AI validation against POV
  - Conflict flagging system
  - Save constraints to project

## Phase 2: IDEATE Components

### 2.1 Rapid Brainstorming Canvas
- **Component**: `src/components/BrainstormingCanvas.jsx`
- **Features**:
  - Digital whiteboard with sticky notes
  - Quick-add input (Enter to post)
  - Drag-and-drop functionality
  - Solution Mixer (combine notes)
  - Color coding for categories
  - Export/Save functionality

### 2.2 AI Spark (Creative Assistance)
- **Component**: `src/components/AISpark.jsx`
- **Features**:
  - "Stuck?" button
  - SCAMPER, Reversal, Exaggeration techniques
  - Context-aware suggestions based on POV
  - Generate new ideas on demand
  - Idea rating system

### 2.3 Prioritization Matrix
- **Component**: `src/components/PrioritizationMatrix.jsx`
- **Features**:
  - Impact vs. Effort 2x2 matrix
  - Drag-and-drop sticky notes
  - Voting mechanism (team collaboration)
  - Visual indicators for winning concept
  - Export selected concept

### 2.4 Technical Specification Generator
- **Component**: `src/components/TechSpecGenerator.jsx`
- **Features**:
  - Triggered after winning concept selection
  - Structured form:
    - Functional Requirements
    - Non-Functional Requirements
    - Architecture Design
  - AI auto-draft suggestions
  - Export to PDF/Markdown
  - Integration with project data

## API Routes Required

### Define Phase
- `POST /api/projects/[id]/pov` - Save POV statement
- `POST /api/projects/[id]/hmw` - Generate HMW questions
- `POST /api/projects/[id]/constraints` - Save constraints
- `POST /api/projects/[id]/validate-pov` - AI POV validation

### Ideate Phase
- `POST /api/projects/[id]/ideas` - Save brainstorming ideas
- `POST /api/projects/[id]/ai-spark` - Generate AI suggestions
- `POST /api/projects/[id]/prioritize` - Save prioritization
- `POST /api/projects/[id]/tech-spec` - Generate/save tech spec

## Database Schema Updates

### Project Model Additions
```javascript
{
  // Existing fields...
  define: {
    persona: {
      name: String,
      image: String,
      painPoint: String
    },
    pov: {
      personaName: String,
      userNeed: String,
      insight: String,
      createdAt: Date
    },
    hmwQuestions: [String],
    constraints: {
      technical: [String],
      business: [String],
      kpis: [{
        metric: String,
        target: String
      }]
    },
    validationFlags: [{
      type: String,
      message: String,
      severity: String
    }]
  },
  ideate: {
    ideas: [{
      id: String,
      text: String,
      color: String,
      position: { x: Number, y: Number },
      createdBy: String,
      createdAt: Date
    }],
    aiSuggestions: [{
      technique: String,
      idea: String,
      createdAt: Date
    }],
    prioritization: {
      matrix: [{
        ideaId: String,
        impact: Number,
        effort: Number,
        votes: Number
      }],
      winningConcept: String
    },
    techSpec: {
      functionalRequirements: [String],
      nonFunctionalRequirements: [String],
      architecture: String,
      generatedAt: Date
    }
  }
}
```

## Implementation Steps

1. **Setup Phase Components Structure**
   - Create component files
   - Setup styling with Tailwind
   - Create base layouts

2. **Implement Define Phase**
   - Build Persona Context Widget
   - Build POV Builder with AI integration
   - Build Reality Board with validation

3. **Implement Ideate Phase**
   - Build Brainstorming Canvas with drag-drop
   - Build AI Spark button
   - Build Prioritization Matrix
   - Build Tech Spec Generator

4. **API Development**
   - Create API routes for all features
   - Integrate Gemini AI for generation
   - Setup database persistence

5. **Integration**
   - Update main project page to show phase-specific components
   - Connect all components to state management
   - Test end-to-end workflow

6. **Polish & Testing**
   - Add animations and transitions
   - Mobile responsiveness
   - Error handling
   - User testing

## Technology Stack
- **Frontend**: React, Next.js, Tailwind CSS
- **Drag & Drop**: react-beautiful-dnd or @dnd-kit
- **AI**: Google Gemini API
- **Database**: MongoDB with Mongoose
- **State Management**: React Context or Zustand

## Timeline Estimate
- Define Phase Components: 2-3 days
- Ideate Phase Components: 3-4 days
- API & Integration: 2-3 days
- Testing & Polish: 1-2 days

**Total: ~8-12 days of development**
