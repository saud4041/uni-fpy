import { SignOut } from "@/app/(auth)/_components/sign-out";
import { auth } from "@/app/(auth)/_utils/auth";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();
  if (!session) redirect("/sign-in");

  return (
    <>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      {!session && (
        <Button asChild>
          <Link href="/sign-in">Sign In</Link>
        </Button>
      )}
      <SignOut />
    </>
  );
};

export default Page;
