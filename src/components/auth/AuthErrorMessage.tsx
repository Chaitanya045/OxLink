interface AuthErrorMessageProps {
  message: string;
}

export function AuthErrorMessage({ message }: AuthErrorMessageProps) {
  if (!message) return null;

  return (
    <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
      {message}
    </div>
  );
}
