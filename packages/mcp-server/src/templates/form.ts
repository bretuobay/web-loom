export interface FormFieldDef {
  name: string;
  type: "string" | "number" | "boolean" | "email" | "url";
  label?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export interface FormTemplateParams {
  name: string;
  fields: FormFieldDef[];
}

function zodValidation(f: FormFieldDef): string {
  const validators: string[] = [];
  if (f.type === "email") validators.push(".email()");
  if (f.type === "url") validators.push(".url()");
  if (f.minLength) validators.push(`.min(${f.minLength})`);
  if (f.maxLength) validators.push(`.max(${f.maxLength})`);

  const baseType =
    f.type === "boolean"
      ? "z.boolean()"
      : f.type === "number"
        ? "z.number()"
        : "z.string()";
  const chain = validators.join("");
  const full = `${baseType}${chain}`;
  return f.required === false ? `${full}.optional()` : full;
}

export function formTemplate(p: FormTemplateParams): string {
  const { name, fields } = p;
  const schemaFields = fields
    .map((f) => `  ${f.name}: ${zodValidation(f)},`)
    .join("\n");

  const fieldRegistrations = fields
    .map(
      (f) =>
        `  form.registerField("${f.name}", { initialValue: ${f.type === "boolean" ? "false" : f.type === "number" ? "0" : '""'} });`
    )
    .join("\n");

  return `import { FormFactory, validateWithZod } from "@web-loom/forms-core";
import { z } from "zod";

const ${name}FormSchema = z.object({
${schemaFields}
});

export type ${name}FormData = z.infer<typeof ${name}FormSchema>;

export const ${name.toLowerCase()}Form = FormFactory.create<${name}FormData>({
  onSubmit: async (values) => {
    // TODO: handle form submission
    console.log("${name} submitted:", values);
  },
  validate: (values) => {
    const result = validateWithZod(${name}FormSchema, values);
    return result.success ? {} : result.errors ?? {};
  },
});

// Register fields
${fieldRegistrations}

// Usage:
// ${name.toLowerCase()}Form.setFieldValue("${fields[0]?.name ?? "field"}", value);
// ${name.toLowerCase()}Form.submit();
// ${name.toLowerCase()}Form.subscribe((state) => { /* react to changes */ });
// ${name.toLowerCase()}Form.getState().isValid
`;
}
