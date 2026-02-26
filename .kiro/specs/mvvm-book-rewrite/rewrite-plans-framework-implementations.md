# Rewrite Plans: Framework Implementations Section (Chapters 8-12)

**Generated:** 2025-01-15  
**Phase:** 3.3 - Rewrite Plan Generation  
**Section:** Framework Implementations (Chapters 8-12)  
**Purpose:** Detailed rewrite plans for framework-specific MVVM implementations

---

## Overview

This document provides comprehensive rewrite plans for the Framework Implementations section (Chapters 8-12). This section demonstrates how the same ViewModels work across React, Vue, Angular, Lit, and Vanilla JavaScript, proving framework independence.

**Key Principle:** Each chapter shows the same GreenWatch ViewModels used in different frameworks, highlighting framework-specific patterns while demonstrating that business logic remains unchanged.

---

## Chapter 8: React Implementation with Hooks

### Metadata
- **Chapter Number:** 8
- **File Name:** `chapter8.mdx`
- **Section:** Framework Implementations
- **Old Chapter Number:** 7 (renamed from "Implementing the View Layer – React Edition")
- **Prerequisites:** Chapters 5, 6, 7
- **Enables:** Chapters 9-12 (for comparison)

### Learning Objectives
1. Implement MVVM in React using hooks
2. Subscribe to ViewModel observables in React components
3. Manage ViewModel lifecycle in React
4. Build GreenWatch UI in React
5. Understand React-specific MVVM patterns
6. Create custom hooks for ViewModel integration

### Core Concepts to Teach

1. **React hooks for ViewModel consumption**
   - useEffect for observable subscriptions
   - useState for local UI state
   - Custom hooks for ViewModel integration
   - Cleanup in useEffect return function
   
2. **useEffect for observable subscriptions**
   - Subscribing to ViewModel observables
   - Dependency array management
   - Cleanup function
   - Avoiding infinite loops
   
3. **Custom hooks for ViewModel integration**
   - useObservable hook
   - useViewModel hook
   - Reusable patterns
   - Type safety
   
4. **React component lifecycle with ViewModels**
   - Component mount → ViewModel initialization
   - Component unmount → ViewModel disposal
   - Re-renders and subscriptions
   
5. **GreenWatch React implementation**
   - Sensor dashboard
   - Sensor list and detail
   - Real-time updates
   - User interactions

### Real Implementations to Reference

**React App:**
- `apps/mvvm-react/` - Complete React implementation

**Key Components:**
- `apps/mvvm-react/src/components/SensorDashboard.tsx`
- `apps/mvvm-react/src/components/SensorList.tsx`
- `apps/mvvm-react/src/components/SensorDetail.tsx`
- `apps/mvvm-react/src/components/GreenHouseList.tsx`

**Custom Hooks:**
- `apps/mvvm-react/src/hooks/useObservable.ts`
- `apps/mvvm-react/src/hooks/useViewModel.ts`

**ViewModels Used:**
- `packages/view-models/src/SensorViewModel.ts`
- `packages/view-models/src/GreenHouseViewModel.ts`
- `packages/view-models/src/SensorReadingViewModel.ts`

