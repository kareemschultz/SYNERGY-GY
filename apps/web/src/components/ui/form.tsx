/**
 * Form Components
 *
 * Type-safe form components built with react-hook-form and Radix UI.
 * Provides proper TypeScript types for all render props and component props.
 */

import type * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
// biome-ignore lint/performance/noNamespaceImport: Auto-fix
import * as React from "react";
import type { ControllerProps, FieldPath, FieldValues } from "react-hook-form";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Form root component - provides form context
 */
const Form = FormProvider;

/**
 * Form context types
 */
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

/**
 * FormField component - wraps Controller from react-hook-form
 * Provides proper TypeScript types for render prop
 */
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

/**
 * Hook to access form field context
 */
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

/**
 * Form item context
 */
type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

/**
 * FormItem component - container for a single form field
 */
const FormItem = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.RefObject<HTMLDivElement | null>;
}) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("space-y-2", className)} ref={ref} {...props} />
    </FormItemContext.Provider>
  );
};
FormItem.displayName = "FormItem";

/**
 * FormLabel component - accessible label for form fields
 */
const FormLabel = ({
  className,
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
  ref?: React.RefObject<React.ElementRef<typeof LabelPrimitive.Root> | null>;
}) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      // biome-ignore lint/nursery/noLeakedRender: Auto-fix
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      ref={ref}
      {...props}
    />
  );
};
FormLabel.displayName = "FormLabel";

/**
 * FormControl component - wrapper for form input elements
 */
const FormControl = ({
  ref,
  ...props
}: React.ComponentPropsWithoutRef<typeof Slot> & {
  ref?: React.RefObject<React.ElementRef<typeof Slot> | null>;
}) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      aria-describedby={
        error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`
      }
      aria-invalid={!!error}
      id={formItemId}
      ref={ref}
      {...props}
    />
  );
};
FormControl.displayName = "FormControl";

/**
 * FormDescription component - helper text for form fields
 */
const FormDescription = ({
  className,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  ref?: React.RefObject<HTMLParagraphElement | null>;
}) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      className={cn("text-muted-foreground text-sm", className)}
      id={formDescriptionId}
      ref={ref}
      {...props}
    />
  );
};
FormDescription.displayName = "FormDescription";

/**
 * FormMessage component - displays validation errors
 */
const FormMessage = ({
  className,
  children,
  ref,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & {
  ref?: React.RefObject<HTMLParagraphElement | null>;
}) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      className={cn("font-medium text-destructive text-sm", className)}
      id={formMessageId}
      ref={ref}
      {...props}
    >
      {body}
    </p>
  );
};
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFormField,
};
