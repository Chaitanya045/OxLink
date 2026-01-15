interface ShortUrlErrorProps {
  code: string;
  message: string;
}

export function ShortUrlError({ code, message }: ShortUrlErrorProps) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">{code}</h1>
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
