"use client";

import { useActionState } from "react";

import { submitBlogPost } from "@/lib/actions/public-actions";
import { INITIAL_FORM_STATE, type FormState } from "@/lib/actions/state";
import { BLOG_CATEGORIES } from "@/lib/constants";
import { FieldError, FormMessage, Honeypot, SubmitButton } from "./form-controls";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

const INITIAL: FormState = INITIAL_FORM_STATE;

export function BlogSubmitForm({ categories }: { categories: string[] }) {
  const [state, formAction] = useActionState(submitBlogPost, INITIAL);
  const errors = (state.errors ?? {}) as Record<string, string>;

  const options = categories.length > 0 ? categories : [...BLOG_CATEGORIES];

  if (state.status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="font-display text-lg font-semibold text-emerald-900">Submission received</h3>
        <p className="mt-2 text-sm leading-relaxed text-emerald-800">{state.message}</p>
        <p className="mt-3 text-xs text-emerald-700">
          You will only see your article on the website once an administrator approves it.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <Honeypot />
      <FormMessage state={state} />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="authorName" required>
            Full Name
          </Label>
          <Input id="authorName" name="authorName" autoComplete="name" required />
          <FieldError message={errors.authorName} />
        </div>
        <div>
          <Label htmlFor="authorEmail" required>
            Email
          </Label>
          <Input id="authorEmail" name="authorEmail" type="email" autoComplete="email" required />
          <FieldError message={errors.authorEmail} />
        </div>
        <div>
          <Label htmlFor="authorMobile" hint="Optional">
            Mobile Number
          </Label>
          <Input id="authorMobile" name="authorMobile" type="tel" inputMode="numeric" autoComplete="tel-national" />
          <FieldError message={errors.authorMobile} />
        </div>
        <div>
          <Label htmlFor="category" required>
            Category
          </Label>
          <Select id="category" name="category" defaultValue="General" required>
            {options.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <FieldError message={errors.category} />
        </div>
      </div>

      <div>
        <Label htmlFor="title" required>
          Blog Title
        </Label>
        <Input id="title" name="title" required maxLength={200} placeholder="A short, descriptive title" />
        <FieldError message={errors.title} />
      </div>

      <div>
        <Label htmlFor="content" required hint="Minimum 50 characters">
          Blog Content
        </Label>
        <Textarea
          id="content"
          name="content"
          rows={8}
          required
          placeholder="Write your article here. Separate paragraphs with a blank line."
        />
        <FieldError message={errors.content} />
      </div>

      <div>
        <Label htmlFor="featuredImage" hint="Optional · JPG, PNG, WebP · max 4 MB">
          Featured Image
        </Label>
        <Input id="featuredImage" name="featuredImage" type="file" accept="image/jpeg,image/png,image/webp,image/avif" />
        <FieldError message={errors.featuredImage} />
        <p className="mt-1.5 text-xs text-slate-500">
          Leave empty to use a default cover image. Content is sanitised before it is stored.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton label="Submit for Review" pendingLabel="Submitting…" />
        <p className="text-xs text-slate-500">
          Submissions are reviewed by trust administrators before publication.
        </p>
      </div>
    </form>
  );
}
