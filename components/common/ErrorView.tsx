interface ErrorViewProps {
  title?: string;
  message: string;
  action?: { label: string; href: string };
  className?: string;
}

export function ErrorView({
  title = "Error",
  message,
  action,
  className = "",
}: ErrorViewProps) {
  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 ${className}`}
    >
      <div className="text-center">
        <p className="text-red-600 font-medium">{title}</p>
        <p className="mt-2 text-gray-600 text-sm">{message}</p>
        {action && (
          <a
            href={action.href}
            className="mt-4 inline-block text-green-600 hover:underline"
          >
            {action.label}
          </a>
        )}
      </div>
    </div>
  );
}
