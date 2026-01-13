---
description: Implement Phase 3 Ideation & Architecture Suite
---
# Phase 3 Implementation Plan

## 1. Database Schema Updates
- Update `src/models/Project.js` to include detailed Tech Stack fields within the `ideate` section.
    - `ideate.prioritization.winningConcept`: Ensure it holds full details.
    - `ideate.techStack`: Add `frontend`, `backend`, `database`, `infra`.

## 2. Module 1: Cross-Pollination Brainstorming
- Update `src/components/AISpark.jsx`:
    - Add "Cross-Domain Mashup" to the spark modes.
- Update `src/app/api/projects/[id]/ai-spark/route.js`:
    - Add specific prompt logic for "Cross-Domain Mashup" (e.g., "Apply principles from Biology/Aviation to...").

## 3. Module 2: Prioritization
- Verify `src/components/PrioritizationMatrix.jsx`:
    - Ensure drag-and-drop works.
    - Ensure "Mark as Winning Concept" functionality saves to `project.ideate.prioritization.winningConcept`.

## 4. Module 3 & 4: Tech Spec & Architecture
- Rename/Refactor `src/components/TechSpecGenerator.jsx` to `ProductDefinitionSuite.jsx` (or keep name and upgrade).
- **Requirements UI**:
    - Functional Req List Builder (Add/Edit/Delete).
    - Non-Functional Req List Builder.
    - AI "Draft Requirements" button -> Calls `generate-techspec`.
- **Architecture UI**:
    - Frontend/Backend/DB Input fields.
    - "Suggest Architecture" AI button.
- Update `src/app/api/projects/[id]/generate-techspec/route.js` to handle both Requirements drafting and Architecture suggestions.

## 5. Integration
- Update `src/app/project/page.jsx` to render the upgraded components in the "Ideate" phase.
