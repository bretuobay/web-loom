# Angular Framework Examples - UI Core Behaviors

This document provides comprehensive Angular examples for all UI Core behaviors.

## Table of Contents

1. [Keyboard Shortcuts](#keyboard-shortcuts)
2. [Undo/Redo Stack](#undoredo-stack)
3. [Drag and Drop](#drag-and-drop)
4. [Roving Focus (Enhanced)](#roving-focus-enhanced)
5. [Form Behavior (Enhanced)](#form-behavior-enhanced)

---

## Keyboard Shortcuts

### Basic Command Palette

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { KeyboardShortcutsService } from '@web-loom/ui-core/angular';

@Component({
  selector: 'app-command-palette',
  template: `
    <div *ngIf="isOpen" class="command-palette">
      <input type="text" placeholder="Type a command..." #inputRef (keydown)="handleKeyDown($event)" />
      <div class="shortcuts-help">
        <p>Press Escape to close</p>
      </div>
    </div>
  `,
  styles: [
    `
      .command-palette {
        position: fixed;
        top: 20%;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        min-width: 400px;
      }
    `,
  ],
  providers: [KeyboardShortcutsService],
})
export class CommandPaletteComponent implements OnInit, OnDestroy {
  isOpen = false;

  constructor(private shortcuts: KeyboardShortcutsService) {}

  ngOnInit() {
    // Register Ctrl+K to open palette
    this.shortcuts.registerShortcut({
      key: 'Ctrl+K',
      handler: () => {
        this.isOpen = true;
      },
      description: 'Open command palette',
      preventDefault: true,
    });

    // Register Escape to close (scoped)
    this.shortcuts.registerShortcut({
      key: 'Escape',
      handler: () => {
        this.isOpen = false;
      },
      description: 'Close command palette',
      scope: 'scoped',
    });

    // Subscribe to state changes
    this.shortcuts.state$.subscribe((state) => {
      // Switch scope when palette opens/closes
      this.shortcuts.setScope(this.isOpen ? 'scoped' : 'global');
    });
  }

  handleKeyDown(event: KeyboardEvent) {
    // Additional keyboard handling if needed
  }

  ngOnDestroy() {
    // Cleanup is handled by the service
  }
}
```

### Text Editor with Multiple Shortcuts

```typescript
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { KeyboardShortcutsService } from '@web-loom/ui-core/angular';

@Component({
  selector: 'app-text-editor',
  template: `
    <div class="text-editor">
      <textarea #editorRef [(ngModel)]="content" placeholder="Start typing..." class="editor-content"></textarea>
      <div class="shortcuts-bar">
        <span>Ctrl+S: Save</span>
        <span>Ctrl+B: Bold</span>
        <span>Ctrl+I: Italic</span>
        <span>Ctrl+F: Find</span>
      </div>
    </div>
  `,
  providers: [KeyboardShortcutsService],
})
export class TextEditorComponent implements OnInit {
  @ViewChild('editorRef') editorRef!: ElementRef<HTMLTextAreaElement>;
  content = '';

  constructor(private shortcuts: KeyboardShortcutsService) {}

  ngOnInit() {
    // Save shortcut
    this.shortcuts.registerShortcut({
      key: 'Ctrl+S',
      handler: () => this.handleSave(),
      description: 'Save document',
      preventDefault: true,
    });

    // Bold text
    this.shortcuts.registerShortcut({
      key: 'Ctrl+B',
      handler: () => this.formatText('bold'),
      description: 'Bold text',
      preventDefault: true,
    });

    // Italic text
    this.shortcuts.registerShortcut({
      key: 'Ctrl+I',
      handler: () => this.formatText('italic'),
      description: 'Italic text',
      preventDefault: true,
    });

    // Find
    this.shortcuts.registerShortcut({
      key: 'Ctrl+F',
      handler: () => this.openFindDialog(),
      description: 'Find in document',
      preventDefault: true,
    });
  }

  handleSave() {
    console.log('Saving document...');
    // Save logic here
  }

  formatText(format: string) {
    console.log(`Applying ${format} formatting`);
    // Format logic here
  }

  openFindDialog() {
    console.log('Opening find dialog');
    // Find dialog logic
  }
}
```

### Shortcut Help Panel

```typescript
import { Component, OnInit } from '@angular/core';
import { KeyboardShortcutsService } from '@web-loom/ui-core/angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface ShortcutInfo {
  key: string;
  description: string;
}

@Component({
  selector: 'app-shortcut-help',
  template: `
    <div class="shortcut-help">
      <h2>Keyboard Shortcuts</h2>
      <table>
        <thead>
          <tr>
            <th>Shortcut</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let shortcut of shortcuts$ | async">
            <td>
              <kbd>{{ shortcut.key }}</kbd>
            </td>
            <td>{{ shortcut.description }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  providers: [KeyboardShortcutsService],
})
export class ShortcutHelpComponent implements OnInit {
  shortcuts$!: Observable<ShortcutInfo[]>;

  constructor(private shortcutService: KeyboardShortcutsService) {}

  ngOnInit() {
    // Register some shortcuts
    this.shortcutService.registerShortcut({
      key: 'Ctrl+K',
      handler: () => {},
      description: 'Open command palette',
    });

    this.shortcutService.registerShortcut({
      key: 'Ctrl+S',
      handler: () => {},
      description: 'Save document',
    });

    this.shortcutService.registerShortcut({
      key: 'Ctrl+Shift+P',
      handler: () => {},
      description: 'Open preferences',
    });

    // Get all registered shortcuts as observable
    this.shortcuts$ = this.shortcutService.state$.pipe(
      map((state) =>
        Array.from(state.shortcuts.values()).map((s) => ({
          key: s.key,
          description: s.description || 'No description',
        })),
      ),
    );
  }
}
```

---

## Undo/Redo Stack

### Simple Text Editor with Undo/Redo

```typescript
import { Component, OnInit } from '@angular/core';
import { UndoRedoStackService } from '@web-loom/ui-core/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-undoable-editor',
  template: `
    <div class="undoable-editor">
      <div class="toolbar">
        <button (click)="handleUndo()" [disabled]="!(state$ | async)?.canUndo" aria-label="Undo">↶ Undo</button>
        <button (click)="handleRedo()" [disabled]="!(state$ | async)?.canRedo" aria-label="Redo">↷ Redo</button>
        <span class="history-info">
          History: {{ (state$ | async)?.past.length }} / {{ (state$ | async)?.maxLength }}
        </span>
      </div>
      <textarea
        [(ngModel)]="text"
        (ngModelChange)="handleTextChange($event)"
        placeholder="Type something..."
        class="editor-content"
      ></textarea>
    </div>
  `,
  providers: [UndoRedoStackService],
})
export class UndoableEditorComponent implements OnInit {
  text = '';
  state$!: Observable<any>;

  constructor(private undoRedo: UndoRedoStackService<string>) {}

  ngOnInit() {
    this.undoRedo.initialize({
      initialState: '',
      maxLength: 50,
      onStateChange: (newText) => {
        this.text = newText;
      },
    });

    this.state$ = this.undoRedo.state$;
  }

  handleTextChange(newText: string) {
    this.undoRedo.pushState(newText);
  }

  handleUndo() {
    this.undoRedo.undo();
  }

  handleRedo() {
    this.undoRedo.redo();
  }
}
```

### Drawing Canvas with Undo/Redo

```typescript
import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { UndoRedoStackService } from '@web-loom/ui-core/angular';
import { Observable } from 'rxjs';

interface CanvasState {
  strokes: Array<{ x: number; y: number }[]>;
}

@Component({
  selector: 'app-drawing-canvas',
  template: `
    <div class="drawing-canvas">
      <div class="toolbar">
        <button (click)="handleUndo()" [disabled]="!(state$ | async)?.canUndo">↶ Undo</button>
        <button (click)="handleRedo()" [disabled]="!(state$ | async)?.canRedo">↷ Redo</button>
        <button (click)="handleClear()">Clear</button>
        <span>Strokes: {{ (state$ | async)?.present.strokes.length }}</span>
      </div>
      <canvas
        #canvas
        width="800"
        height="600"
        (mousedown)="handleMouseDown($event)"
        (mousemove)="handleMouseMove($event)"
        (mouseup)="handleMouseUp()"
        (mouseleave)="handleMouseUp()"
        class="canvas"
      ></canvas>
    </div>
  `,
  providers: [UndoRedoStackService],
})
export class DrawingCanvasComponent implements OnInit, AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  isDrawing = false;
  currentStroke: Array<{ x: number; y: number }> = [];
  state$!: Observable<any>;

  constructor(private undoRedo: UndoRedoStackService<CanvasState>) {}

  ngOnInit() {
    this.undoRedo.initialize({
      initialState: { strokes: [] },
      maxLength: 100,
      onStateChange: (state) => this.redrawCanvas(state),
    });

    this.state$ = this.undoRedo.state$;
  }

  ngAfterViewInit() {
    // Canvas is now available
  }

  redrawCanvas(state: CanvasState) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Redraw all strokes
    state.strokes.forEach((stroke) => {
      if (stroke.length < 2) return;

      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      stroke.slice(1).forEach((point) => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    });
  }

  handleMouseDown(e: MouseEvent) {
    this.isDrawing = true;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();

    this.currentStroke = [
      {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      },
    ];
  }

  handleMouseMove(e: MouseEvent) {
    if (!this.isDrawing) return;

    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    this.currentStroke.push(point);

    // Draw current stroke
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    if (!ctx || this.currentStroke.length === 0) return;

    const lastPoint = this.currentStroke[this.currentStroke.length - 2];
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
  }

  handleMouseUp() {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    // Save stroke to history
    const currentState = this.undoRedo.getState();
    this.undoRedo.pushState({
      strokes: [...currentState.present.strokes, this.currentStroke],
    });

    this.currentStroke = [];
  }

  handleUndo() {
    this.undoRedo.undo();
  }

  handleRedo() {
    this.undoRedo.redo();
  }

  handleClear() {
    this.undoRedo.pushState({ strokes: [] });
  }
}
```

### Form with Undo/Redo

```typescript
import { Component, OnInit } from '@angular/core';
import { UndoRedoStackService } from '@web-loom/ui-core/angular';
import { Observable } from 'rxjs';

interface FormState {
  name: string;
  email: string;
  message: string;
}

@Component({
  selector: 'app-undoable-form',
  template: `
    <div class="undoable-form">
      <div class="toolbar">
        <button (click)="handleUndo()" [disabled]="!(state$ | async)?.canUndo">↶ Undo</button>
        <button (click)="handleRedo()" [disabled]="!(state$ | async)?.canRedo">↷ Redo</button>
      </div>

      <form>
        <div class="form-field">
          <label for="name">Name:</label>
          <input id="name" type="text" [(ngModel)]="formData.name" (ngModelChange)="handleFieldChange()" name="name" />
        </div>

        <div class="form-field">
          <label for="email">Email:</label>
          <input
            id="email"
            type="email"
            [(ngModel)]="formData.email"
            (ngModelChange)="handleFieldChange()"
            name="email"
          />
        </div>

        <div class="form-field">
          <label for="message">Message:</label>
          <textarea
            id="message"
            [(ngModel)]="formData.message"
            (ngModelChange)="handleFieldChange()"
            name="message"
          ></textarea>
        </div>
      </form>
    </div>
  `,
  providers: [UndoRedoStackService],
})
export class UndoableFormComponent implements OnInit {
  formData: FormState = {
    name: '',
    email: '',
    message: '',
  };

  state$!: Observable<any>;

  constructor(private undoRedo: UndoRedoStackService<FormState>) {}

  ngOnInit() {
    this.undoRedo.initialize({
      initialState: { ...this.formData },
      maxLength: 20,
      onStateChange: (state) => {
        this.formData = { ...state };
      },
    });

    this.state$ = this.undoRedo.state$;
  }

  handleFieldChange() {
    this.undoRedo.pushState({ ...this.formData });
  }

  handleUndo() {
    this.undoRedo.undo();
  }

  handleRedo() {
    this.undoRedo.redo();
  }
}
```

---

## Drag and Drop

### Reorderable List

```typescript
import { Component, OnInit } from '@angular/core';
import { DragDropBehaviorService } from '@web-loom/ui-core/angular';
import { Observable } from 'rxjs';

interface Item {
  id: string;
  text: string;
}

@Component({
  selector: 'app-reorderable-list',
  template: `
    <div class="reorderable-list">
      <h2>Drag to Reorder</h2>
      <ul>
        <li
          *ngFor="let item of items"
          draggable="true"
          (dragstart)="handleDragStart(item.id)"
          (dragover)="handleDragOver($event, item.id)"
          (drop)="handleDrop(item.id)"
          [class.dragging]="(state$ | async)?.draggedItem === item.id"
          [class.drop-target]="(state$ | async)?.dropTarget === item.id"
        >
          {{ item.text }}
        </li>
      </ul>
    </div>
  `,
  providers: [DragDropBehaviorService],
})
export class ReorderableListComponent implements OnInit {
  items: Item[] = [
    { id: '1', text: 'Item 1' },
    { id: '2', text: 'Item 2' },
    { id: '3', text: 'Item 3' },
    { id: '4', text: 'Item 4' },
  ];

  state$!: Observable<any>;

  constructor(private dragDrop: DragDropBehaviorService) {}

  ngOnInit() {
    this.dragDrop.initialize({
      onDragStart: (itemId) => console.log('Drag started:', itemId),
      onDragEnd: (itemId) => console.log('Drag ended:', itemId),
      onDrop: (draggedId, targetId) => {
        // Reorder items
        const draggedIndex = this.items.findIndex((item) => item.id === draggedId);
        const targetIndex = this.items.findIndex((item) => item.id === targetId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        const newItems = [...this.items];
        const [draggedItem] = newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, draggedItem);
        this.items = newItems;
      },
    });

    this.state$ = this.dragDrop.state$;

    // Register all items as drop zones
    this.items.forEach((item) => {
      this.dragDrop.registerDropZone(item.id);
    });
  }

  handleDragStart(itemId: string) {
    this.dragDrop.startDrag(itemId);
  }

  handleDragOver(event: DragEvent, itemId: string) {
    event.preventDefault();
    this.dragDrop.setDropTarget(itemId);
  }

  handleDrop(itemId: string) {
    this.dragDrop.drop(itemId);
    this.dragDrop.endDrag();
  }

  ngOnDestroy() {
    this.items.forEach((item) => {
      this.dragDrop.unregisterDropZone(item.id);
    });
  }
}
```

### Kanban Board

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DragDropBehaviorService } from '@web-loom/ui-core/angular';
import { Observable } from 'rxjs';

interface Task {
  id: string;
  title: string;
  column: string;
}

@Component({
  selector: 'app-kanban-board',
  template: `
    <div class="kanban-board">
      <div
        *ngFor="let column of columns"
        class="kanban-column"
        (dragover)="handleDragOver($event, column)"
        (drop)="handleColumnDrop(column)"
      >
        <h3>{{ column.replace('-', ' ').toUpperCase() }}</h3>
        <div
          *ngFor="let task of getTasksForColumn(column)"
          draggable="true"
          (dragstart)="dragDrop.startDrag(task.id)"
          class="kanban-task"
        >
          {{ task.title }}
        </div>
      </div>
    </div>
  `,
  providers: [DragDropBehaviorService],
})
export class KanbanBoardComponent implements OnInit, OnDestroy {
  tasks: Task[] = [
    { id: '1', title: 'Task 1', column: 'todo' },
    { id: '2', title: 'Task 2', column: 'todo' },
    { id: '3', title: 'Task 3', column: 'in-progress' },
    { id: '4', title: 'Task 4', column: 'done' },
  ];

  columns = ['todo', 'in-progress', 'done'];

  constructor(public dragDrop: DragDropBehaviorService) {}

  ngOnInit() {
    this.dragDrop.initialize({
      onDrop: (taskId, columnId) => {
        this.tasks = this.tasks.map((task) => (task.id === taskId ? { ...task, column: columnId } : task));
      },
    });

    this.columns.forEach((col) => this.dragDrop.registerDropZone(col));
  }

  getTasksForColumn(column: string): Task[] {
    return this.tasks.filter((task) => task.column === column);
  }

  handleDragOver(event: DragEvent, column: string) {
    event.preventDefault();
    this.dragDrop.setDropTarget(column);
  }

  handleColumnDrop(column: string) {
    const state = this.dragDrop.getState();
    if (state.draggedItem) {
      this.dragDrop.drop(column);
    }
    this.dragDrop.endDrag();
  }

  ngOnDestroy() {
    this.columns.forEach((col) => this.dragDrop.unregisterDropZone(col));
  }
}
```

### File Upload with Drag and Drop

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DragDropBehaviorService } from '@web-loom/ui-core/angular';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-file-upload',
  template: `
    <div class="file-upload">
      <div
        [class.active]="(state$ | async)?.dropTarget === 'upload-zone'"
        class="upload-zone"
        (dragover)="handleDragOver($event)"
        (drop)="handleDrop($event)"
      >
        <p>Drag files here to upload</p>
      </div>

      <div *ngIf="files.length > 0" class="file-list">
        <h3>Uploaded Files:</h3>
        <ul>
          <li *ngFor="let file of files">{{ file.name }}</li>
        </ul>
      </div>
    </div>
  `,
  providers: [DragDropBehaviorService],
})
export class FileUploadComponent implements OnInit, OnDestroy {
  files: File[] = [];
  state$!: Observable<any>;

  constructor(private dragDrop: DragDropBehaviorService) {}

  ngOnInit() {
    this.dragDrop.initialize({
      onDragStart: () => console.log('Drag started'),
      onDrop: (_, __, data) => {
        if (data?.files) {
          this.files = [...this.files, ...Array.from(data.files)];
        }
      },
    });

    this.state$ = this.dragDrop.state$;
    this.dragDrop.registerDropZone('upload-zone');
  }

  handleDragOver(event: DragEvent) {
    event.preventDefault();
    this.dragDrop.setDropTarget('upload-zone');
  }

  handleDrop(event: DragEvent) {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    this.dragDrop.startDrag('files', { files: droppedFiles });
    this.dragDrop.drop('upload-zone');
    this.dragDrop.endDrag();
  }

  ngOnDestroy() {
    this.dragDrop.unregisterDropZone('upload-zone');
  }
}
```

---

## Roving Focus (Enhanced)

### Menu with Focus Tracking

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RovingFocusService } from '@web-loom/ui-core/angular';
import { Observable } from 'rxjs';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-menu-with-tracking',
  template: `
    <div class="menu-with-tracking" (keydown)="handleKeyDown($event)">
      <div class="focus-info">
        <p>Currently focused: {{ focusedItem || 'None' }}</p>
        <p>Previously focused: {{ previousItem || 'None' }}</p>
      </div>

      <ul role="menu">
        <li
          *ngFor="let item of items; let i = index"
          role="menuitem"
          [tabindex]="(state$ | async)?.focusedIndex === i ? 0 : -1"
          [class.focused]="(state$ | async)?.focusedIndex === i"
          (click)="rovingFocus.setFocusedIndex(i)"
        >
          <span class="icon">{{ item.icon }}</span>
          <span class="label">{{ item.label }}</span>
        </li>
      </ul>
    </div>
  `,
  providers: [RovingFocusService],
})
export class MenuWithTrackingComponent implements OnInit, OnDestroy {
  focusedItem: string | null = null;
  previousItem: string | null = null;
  state$!: Observable<any>;

  items: MenuItem[] = [
    { id: 'new', label: 'New File', icon: '📄' },
    { id: 'open', label: 'Open', icon: '📂' },
    { id: 'save', label: 'Save', icon: '💾' },
    { id: 'close', label: 'Close', icon: '❌' },
  ];

  constructor(public rovingFocus: RovingFocusService) {}

  ngOnInit() {
    this.rovingFocus.initialize({
      items: this.items.map((item) => item.id),
      onFocusChange: (index, itemId, previousIndex) => {
        this.focusedItem = itemId;
        if (previousIndex !== -1) {
          this.previousItem = this.items[previousIndex]?.id || null;
        }
        console.log(`Focus moved from ${previousIndex} to ${index}`);
      },
    });

    this.state$ = this.rovingFocus.state$;
  }

  handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.rovingFocus.moveNext();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.rovingFocus.movePrevious();
    } else if (event.key === 'Home') {
      event.preventDefault();
      this.rovingFocus.moveFirst();
    } else if (event.key === 'End') {
      event.preventDefault();
      this.rovingFocus.moveLast();
    }
  }

  ngOnDestroy() {
    // Cleanup handled by service
  }
}
```

---

## Form Behavior (Enhanced)

### Form with Server-Side Validation

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBehaviorService } from '@web-loom/ui-core/angular';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

interface LoginForm {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login-form',
  template: `
    <form (submit)="handleSubmit($event)" class="login-form">
      <div class="form-field">
        <label for="username">Username:</label>
        <input
          id="username"
          type="text"
          [value]="(state$ | async)?.values.username"
          (input)="form.setFieldValue('username', $any($event.target).value)"
          (blur)="form.validateField('username')"
          [attr.aria-invalid]="!!(state$ | async)?.errors.username"
          [attr.aria-describedby]="(state$ | async)?.errors.username ? 'username-error' : null"
        />
        <span *ngIf="(state$ | async)?.errors.username" id="username-error" class="error">
          {{ (state$ | async)?.errors.username }}
        </span>
      </div>

      <div class="form-field">
        <label for="password">Password:</label>
        <input
          id="password"
          type="password"
          [value]="(state$ | async)?.values.password"
          (input)="form.setFieldValue('password', $any($event.target).value)"
          (blur)="form.validateField('password')"
          [attr.aria-invalid]="!!(state$ | async)?.errors.password"
          [attr.aria-describedby]="(state$ | async)?.errors.password ? 'password-error' : null"
        />
        <span *ngIf="(state$ | async)?.errors.password" id="password-error" class="error">
          {{ (state$ | async)?.errors.password }}
        </span>
      </div>

      <button type="submit" [disabled]="!(state$ | async)?.isValid">Login</button>
    </form>
  `,
  providers: [FormBehaviorService],
})
export class LoginFormComponent implements OnInit {
  state$!: Observable<any>;

  constructor(
    public form: FormBehaviorService<LoginForm>,
    private http: HttpClient,
  ) {}

  ngOnInit() {
    this.form.initialize({
      initialValues: {
        username: '',
        password: '',
      },
      validators: {
        username: (value) => {
          if (!value) return 'Username is required';
          if (value.length < 3) return 'Username must be at least 3 characters';
          return null;
        },
        password: (value) => {
          if (!value) return 'Password is required';
          if (value.length < 8) return 'Password must be at least 8 characters';
          return null;
        },
      },
    });

    this.state$ = this.form.state$;
  }

  async handleSubmit(event: Event) {
    event.preventDefault();

    // Validate form
    this.form.validateForm();
    const state = this.form.getState();

    if (!state.isValid) {
      return;
    }

    try {
      // Simulate API call
      await this.http.post('/api/login', state.values).toPromise();
      console.log('Login successful!');
    } catch (error: any) {
      // Set server-side errors manually
      if (error.field === 'username') {
        this.form.setFieldError('username', error.message);
      } else if (error.field === 'password') {
        this.form.setFieldError('password', error.message);
      }
    }
  }
}
```

---

## Complete Integration Example

### Text Editor with All Features

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { KeyboardShortcutsService, UndoRedoStackService, FormBehaviorService } from '@web-loom/ui-core/angular';
import { Observable } from 'rxjs';

interface EditorState {
  content: string;
  title: string;
}

@Component({
  selector: 'app-full-featured-editor',
  template: `
    <div class="full-featured-editor">
      <div class="toolbar">
        <input
          type="text"
          [value]="(formState$ | async)?.values.title"
          (input)="form.setFieldValue('title', $any($event.target).value)"
          placeholder="Document title"
        />

        <button (click)="undoRedo.undo()" [disabled]="!(undoRedoState$ | async)?.canUndo">↶ Undo (Ctrl+Z)</button>

        <button (click)="undoRedo.redo()" [disabled]="!(undoRedoState$ | async)?.canRedo">↷ Redo (Ctrl+Y)</button>

        <button (click)="handleSave()" [disabled]="isSaved">💾 Save (Ctrl+S)</button>

        <span [class.saved]="isSaved" [class.unsaved]="!isSaved">
          {{ isSaved ? '✓ Saved' : '• Unsaved changes' }}
        </span>
      </div>

      <textarea
        [(ngModel)]="content"
        (ngModelChange)="handleContentChange($event)"
        placeholder="Start typing..."
        class="editor-content"
      ></textarea>

      <div class="status-bar">
        <span>History: {{ (undoRedoState$ | async)?.past.length }} / {{ (undoRedoState$ | async)?.maxLength }}</span>
        <span>Characters: {{ (undoRedoState$ | async)?.present.content.length }}</span>
      </div>
    </div>
  `,
  providers: [KeyboardShortcutsService, UndoRedoStackService, FormBehaviorService],
})
export class FullFeaturedEditorComponent implements OnInit, OnDestroy {
  isSaved = true;
  content = '';
  undoRedoState$!: Observable<any>;
  formState$!: Observable<any>;

  constructor(
    private shortcuts: KeyboardShortcutsService,
    public undoRedo: UndoRedoStackService<EditorState>,
    public form: FormBehaviorService<any>,
  ) {}

  ngOnInit() {
    // Initialize undo/redo
    this.undoRedo.initialize({
      initialState: { content: '', title: 'Untitled' },
      maxLength: 100,
    });

    this.undoRedoState$ = this.undoRedo.state$;

    // Initialize form
    this.form.initialize({
      initialValues: {
        title: 'Untitled',
        author: '',
      },
    });

    this.formState$ = this.form.state$;

    // Register keyboard shortcuts
    this.shortcuts.registerShortcut({
      key: 'Ctrl+S',
      handler: () => this.handleSave(),
      description: 'Save document',
      preventDefault: true,
    });

    this.shortcuts.registerShortcut({
      key: 'Ctrl+Z',
      handler: () => this.undoRedo.undo(),
      description: 'Undo',
      preventDefault: true,
    });

    this.shortcuts.registerShortcut({
      key: 'Ctrl+Y',
      handler: () => this.undoRedo.redo(),
      description: 'Redo',
      preventDefault: true,
    });
  }

  handleSave() {
    console.log('Saving document...');
    this.isSaved = true;
    // Save logic here
  }

  handleContentChange(content: string) {
    const state = this.undoRedo.getState();
    this.undoRedo.pushState({ ...state.present, content });
    this.isSaved = false;
  }

  ngOnDestroy() {
    // Cleanup handled by services
  }
}
```

---

## Best Practices

### 1. Use Dependency Injection

```typescript
@Component({
  selector: 'app-my-component',
  providers: [KeyboardShortcutsService], // Provide at component level
})
export class MyComponent {
  constructor(private shortcuts: KeyboardShortcutsService) {}
}
```

### 2. Use Async Pipe for Observables

```typescript
// Template
<div *ngIf="state$ | async as state">
  {{ state.value }}
</div>

// Component
state$ = this.service.state$;
```

### 3. Clean Up in ngOnDestroy

```typescript
ngOnDestroy() {
  // Services handle cleanup automatically
  // But unregister drop zones if needed
  this.dragDrop.unregisterDropZone('zone-id');
}
```

### 4. Use RxJS Operators

```typescript
import { map, filter } from 'rxjs/operators';

shortcuts$ = this.shortcutService.state$.pipe(
  map((state) => state.activeShortcuts),
  filter((shortcuts) => shortcuts.length > 0),
);
```

---

## TypeScript Tips

### Type-Safe Services

```typescript
constructor(
  private shortcuts: KeyboardShortcutsService,
  private undoRedo: UndoRedoStackService<MyStateType>,
  private form: FormBehaviorService<MyFormType>
) {}
```

### Generic Services

```typescript
export class MyComponent<T> {
  constructor(private undoRedo: UndoRedoStackService<T>) {}
}
```

---

This completes the Angular examples for UI Core behaviors. For UI Patterns examples, see the patterns documentation.
