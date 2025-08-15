import db from "@/lib/db";
export default async function Home() {
  const user = await db.user.findMany();
  console.log('user', user)
  return (
    <>{JSON.stringify(user)}</>
  );
}
