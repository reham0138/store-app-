import { useState } from "react";

import Button from "../Button";
import { FormError } from "../FormError";
import { Input } from "../Input";
import { Label } from "../Label";
import { Select } from "../Select";
import { USE_MOCK } from "../../api/mock";

interface CategoryOption {
  id: string;
  name: string;
}

export interface ProductFormValues {
  title: string;
  brand: string;
  category: string;
  price: string;
  stock: string;
  discountPercentage: string;
  description: string;
}

interface ProductFormProps {
  initialValues: ProductFormValues;
  mode: "add" | "edit";
  categories?: CategoryOption[];
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

export default function ProductForm({
  initialValues,
  mode,
  categories = [],
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");

  function updateField(field: keyof ProductFormValues, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const price = Number(values.price);
    const discountPercentage = Number(values.discountPercentage);

    if (!values.title.trim() || !values.category.trim() || (!USE_MOCK && !values.brand.trim())) {
      setError(USE_MOCK ? "Title and category are required." : "Title, SKU, and category are required.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setError("Price must be a valid non-negative number.");
      return;
    }
    // Stock is only editable on create; per-branch stock/price changes go
    // through PATCH /products/:id/stock and /branch-price instead.
    if (mode === "add") {
      const stock = Number(values.stock);
      if (!Number.isInteger(stock) || stock < 0) {
        setError("Stock must be a whole number equal to or above zero.");
        return;
      }
    }
    if (
      !Number.isFinite(discountPercentage) ||
      discountPercentage < 0 ||
      discountPercentage > 100
    ) {
      setError("Discount must be between 0 and 100.");
      return;
    }

    setError("");
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      {error && <FormError message={error} />}

      <div className="grid gap-5 sm:grid-cols-2">
        <Label label="Product title" required>
          <Input
            value={values.title}
            onChange={(event) => updateField("title", event.target.value)}
            placeholder="Enter product title"
            required
          />
        </Label>
        <Label label={USE_MOCK ? "Brand" : "SKU"} required={!USE_MOCK}>
          <Input
            value={values.brand}
            onChange={(event) => updateField("brand", event.target.value)}
            placeholder={USE_MOCK ? "Enter brand" : "Enter product SKU"}
            required={!USE_MOCK}
          />
        </Label>
        <Label label="Category" required>
          {USE_MOCK ? (
            <Input
              value={values.category}
              onChange={(event) => updateField("category", event.target.value)}
              placeholder="Enter category"
              required
            />
          ) : (
            <Select
              value={values.category}
              options={categories.map((category) => ({
                value: category.id,
                label: category.name,
              }))}
              placeholder={categories.length ? "Select category" : "No categories available"}
              disabled={categories.length === 0}
              onChange={(event) => updateField("category", event.target.value)}
            />
          )}
        </Label>
        <Label label="Price" required>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(event) => updateField("price", event.target.value)}
            placeholder="0.00"
            required
          />
        </Label>
        {mode === "add" && (
          <Label label="Stock" required>
            <Input
              type="number"
              min="0"
              step="1"
              value={values.stock}
              onChange={(event) => updateField("stock", event.target.value)}
              placeholder="0"
              required
            />
          </Label>
        )}
        {USE_MOCK && (
          <Label label="Discount percentage">
            <Input
              type="number"
              min="0"
              max="100"
              step="1"
              value={values.discountPercentage}
              onChange={(event) =>
                updateField("discountPercentage", event.target.value)
              }
              placeholder="0"
            />
          </Label>
        )}
      </div>

      <Label label="Description">
        <textarea
          value={values.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Enter product description"
          rows={4}
          className="input resize-y"
        />
      </Label>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {mode === "add" ? "Add product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
