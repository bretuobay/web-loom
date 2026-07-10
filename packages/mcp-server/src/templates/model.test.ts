import { describe, expect, it } from "vitest";
import { modelTemplate } from "./model.js";
import { viewModelTemplate } from "./viewmodel.js";

const fields = [
  { name: "title", type: "string" as const },
  { name: "price", type: "number" as const },
];

describe("modelTemplate", () => {
  it("generates the default RestfulApiModel class with a reusable config", () => {
    const code = modelTemplate({ name: "Product", endpoint: "/products", fields });

    expect(code).toContain('import { RestfulApiModel } from "@web-loom/mvvm-core";');
    expect(code).toContain("export const productConfig =");
    expect(code).toContain("fetcher: async <TResponse = Response>");
    expect(code).toContain("return response as TResponse;");
    expect(code).toContain("export class ProductModel extends RestfulApiModel");
    expect(code).toContain("...productConfig");
  });

  it("generates a REST config-only model module for reactive factories", () => {
    const code = modelTemplate({
      name: "Product",
      endpoint: "/products",
      fields,
      style: "restful-config",
    });

    expect(code).toContain("export const productConfig =");
    expect(code).toContain("export const ProductListSchema");
    expect(code).not.toContain("export class ProductModel");
  });

  it("generates a simple BaseModel state class", () => {
    const code = modelTemplate({
      name: "Product",
      endpoint: "/products",
      fields,
      style: "base-state",
    });

    expect(code).toContain('import { BaseModel } from "@web-loom/mvvm-core";');
    expect(code).toContain("export class ProductModel extends BaseModel");
    expect(code).toContain("public async fetch(): Promise<void>");
    expect(code).toContain("public replaceAll(items: ProductListData): void");
  });

  it("generates a QueryCore cached list model", () => {
    const code = modelTemplate({
      name: "Catalog",
      endpoint: "/catalog",
      fields,
      style: "query-cache",
    });

    expect(code).toContain('import { QueryCore, type EndpointState } from "@web-loom/query-core";');
    expect(code).toContain('cacheProvider: "inMemory"');
    expect(code).toContain('await this.query.defineEndpoint("catalog:list"');
    expect(code).toContain("private syncFromQueryState(state: EndpointState<CatalogListData>): void");
  });

  it("keeps model and ViewModel factory exports compatible", () => {
    const modelCode = modelTemplate({
      name: "Product",
      endpoint: "/products",
      fields,
      style: "restful-config",
    });
    const viewModelCode = viewModelTemplate({
      name: "Product",
      modelClass: "ProductModel",
      schemaModule: "./ProductModel.js",
      style: "reactive-factory",
    });

    expect(modelCode).toContain("export const productConfig =");
    expect(viewModelCode).toContain("modelConfig: productConfig");
  });
});
