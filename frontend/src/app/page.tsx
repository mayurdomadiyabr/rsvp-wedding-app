import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold tracking-tight">
          Wedding RSVP
        </h1>
        <p className="text-lg text-muted-foreground">
          Manage your wedding events and guest RSVPs with ease.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
