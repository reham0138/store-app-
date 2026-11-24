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
  images: string[];
}

interface ProductFormProps {
  initialValues: ProductFormValues;
  mode: "add" | "edit";
  categories?: CategoryOption[];
  onImageUpload?: (file: File) => Promise<string>;
  onSubmit: (values: ProductFormValues) => void;
  onCancel: () => void;
}

export default function ProductForm({
  initialValues,
  mode,
  categories = [],
  onImageUpload,
  onSubmit,
  onCancel,
}: ProductFormProps) {
  const [values, setValues] = useState(() => ({
    ...initialValues,
    images: [...initialValues.images],
  }));
  const [error, setError] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  function updateField(
    field: Exclude<keyof ProductFormValues, "images">,
    value: string,
  ) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  async function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) return;
    if (!onImageUpload) {
      setError("Switch to live backend mode to upload product images.");
      return;
    }
    if (values.images.length + files.length > 8) {
      setError("A product can have up to 8 images.");
      return;
    }

    setError("");
    setUploadingImages(true);
    try {
      for (const file of files) {
        const url = await onImageUpload(file);
        setValues((previous) => ({ ...previous, images: [...previous.images, url] }));
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Failed to upload image.");
    } finally {
      setUploadingImages(false);
    }
  }

  function removeImage(url: string) {
    setValues((previous) => ({
      ...previous,
      images: previous.images.filter((image) => image !== url),
    }));
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
    if (uploadingImages) return;
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

      <div className="grid gap-3">
        <Label label="Product images">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple
            disabled={!onImageUpload || uploadingImages || values.images.length >= 8}
            onChange={(event) => void handleImageSelection(event)}
          />
        </Label>
        <p className="text-xs text-text-slate">
          Upload up to 8 images, max 8 MB each. The first image is used as the main product image.
          {!onImageUpload && " Set VITE_USE_MOCK=false to upload."}
        </p>
        {uploadingImages && (
          <p className="text-sm text-text-slate" role="status">Uploading image...</p>
        )}
        {values.images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {values.images.map((image, index) => (
              <div key={`${image}-${index}`} className="relative">
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="h-28 w-full rounded-lg border border-border-subtle object-cover"
                />
                {index === 0 && (
                  <span className="absolute bottom-1 start-1 rounded bg-surface-white/90 px-2 py-1 text-xs">
                    Main image
                  </span>
                )}
                <button
                  type="button"
                  disabled={uploadingImages}
                  onClick={() => removeImage(image)}
                  className="absolute end-1 top-1 rounded bg-surface-white px-2 py-1 text-xs text-status-error shadow"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="tertiary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploadingImages}>
          {uploadingImages ? "Uploading..." : mode === "add" ? "Add product" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
