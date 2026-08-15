import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group max-sm:!w-[calc(100vw-2rem)]"
      style={{ "--width": "min(22rem, calc(100vw - 2rem))" } as React.CSSProperties}
      mobileOffset={{ left: "1rem", right: "1rem", top: "1rem" }}
      toastOptions={{
        classNames: {
          toast:
            "group toast w-full max-w-[calc(100vw-2rem)] group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          title: "break-words",
          description: "group-[.toast]:text-muted-foreground break-words",

          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
