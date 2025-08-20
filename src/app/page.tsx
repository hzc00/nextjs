import Link from "next/link";
export default async function page() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Link href="/admin">
        <h1 className="cursor-pointer text-green-400 underline">
          click visit admin page
        </h1>
      </Link>
    </div>
  );
}
