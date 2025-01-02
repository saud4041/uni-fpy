import { signIn } from "@/app/(auth)/_utils/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { executeAction } from "@/db/utils/executeAction";

const SignIn = () => {
  return (
    <>
      <form
        action={async () => {
          "use server";
          await signIn("github");
        }}
      >
        <Button variant="default" type="submit">
          Signin with GitHub
        </Button>
      </form>
      <br />
      <form
        action={async (formData) => {
          "use server";
          await executeAction({
            actionFn: async () => {
              await signIn("credentials", formData);
            },
          });
        }}
      >
        <Input name="email" placeholder="Email" type="email" />
        <Input name="password" placeholder="Password" type="password" />
        <Button variant="default" type="submit">
          Sign in with Credentials
        </Button>
      </form>
    </>
  );
};

export { SignIn };
