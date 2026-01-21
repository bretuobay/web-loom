import { BaseModel } from '../../models/BaseModel';

export interface TodoItemData {
  id: string;
  text: string;
  isCompleted: boolean;
}

export class TodoItem extends BaseModel<TodoItemData, any> {
  constructor({ initialData, schema: {} }: { initialData: TodoItemData; schema: any }) {
    const { id, text, isCompleted } = initialData;
    super({
      initialData: { id, text, isCompleted },
      schema: {},
    });
  }

  public get id(): string {
    return this.getCurrentData()!.id;
  }

  public get text(): string {
    return this.getCurrentData()!.text;
  }

  public setText(newText: string): void {
    const currentData = this.getCurrentData();
    if (currentData) {
      this.setData({ ...currentData, text: newText });
    }
  }

  public get isCompleted(): boolean {
    return this.getCurrentData()!.isCompleted;
  }

  public toggleCompletion(): void {
    const currentData = this.getCurrentData();
    if (currentData) {
      this.setData({
        ...currentData,
        isCompleted: !currentData.isCompleted,
      });
    }
  }
}
