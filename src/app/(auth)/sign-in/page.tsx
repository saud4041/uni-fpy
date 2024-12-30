import { auth } from "@/app/(auth)/_utils/auth";
import { SignIn } from "@/app/(auth)/sign-in/_components/sign-in";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();

  if (session) redirect("/");
  return <SignIn />;
};

export default Page;
