import { signUp } from "@/app/(auth)/sign-up/_services/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";

const SignUp = () => {
  return (
    <form
      action={async (formData) => {
        "use server";

        const res = await signUp(formData);
        if (res.success) {
          redirect("/sign-in");
        }
      }}
    >
      <Input name="email" placeholder="Email" type="email" />
      <Input name="password" placeholder="Password" type="password" />
      <Button variant="default" type="submit">
        Sign Up
      </Button>
    </form>
  );
};

export { SignUp };
