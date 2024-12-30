"use client";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

const SignOut = () => {
  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Button variant="destructive" onClick={handleSignOut}>
      Sign Out
    </Button>
  );
};

export { SignOut };
