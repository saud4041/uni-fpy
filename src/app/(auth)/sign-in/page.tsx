import { auth } from "@/app/(auth)/_utils/auth";
import { SignIn } from "@/app/(auth)/sign-in/_components/sign-in";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();

  if (session) redirect("/");
  return (
    <>
      <SignIn />
      <Button asChild>
        <Link href="/sign-up">Sign Up</Link>
      </Button>
    </>
  );
};

export default Page;
