todo:
zod in credentials
add sign up for credentials

<!--  -->

---

npx create-next-app@latest .
.nvmrc
npm install next-auth@beta
npx auth secret
npx shadcn@latest init (default, neutral)

npx shadcn@latest add button

```typescript page.tsx
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
    </>
  );
};
```

npm run dev to see everything works

(auth)/\_utils/auth.ts

```typescript
import NextAuth from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [],
});
```

app/api/auth/[...nextauth]/route.ts

```typescript
import { handlers } from "@/app/(auth)/_utils/auth";
export const { GET, POST } = handlers;
```

middleware.ts

```typescript
export { auth as middleware } from "@/app/(auth)/_utils/auth";
```

oauth
https://github.com/settings/developers
new oauth app
app name: auth-tutorial
homepage: http://localhost:3000
callback url: http://localhost:3000/api/auth/callback/github

copy client id and client secrets

and paste in env
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=

```typescript
  providers: [GitHub],
```

```typescript (auth)/sign-in/_components/sign-in.tsx
const SignIn = () => {
  return (
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
  );
};
```

```typescript app/(auth)/sign-in/page.tsx
const Page = () => {
  const session = await auth();

  if (session) redirect("/");
  return <SignIn />;
};

export default Page;
```

do sign up we github

go to app on github and see user has added
see user's session

```typescript (auth)/_components/sign-out
"use client";
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
```

you can add other providers like this according to docs if you want but they are mostly similar and very easy to do with authjs

put it in page.tsx and show user logs out and again log in

now for credentials

```typescript
Credentials({
  credentials: {
    email: {},
    password: {},
  },
  authorize: async (credentials) => {
    const email = "admin@admin.com";
    const password = "1234";

    if (credentials.email === email && credentials.password === password) {
      return { email, password };
    } else {
      throw new Error("Invalid credentials.");

    }
  },
}),
```

npx shadcn@latest add input

```typescript
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
      try {
        await signIn("credentials", formData);
      } catch (error) {
        console.log("Error during sign in", error);
      }
    }}
  >
    <Input name="email" placeholder="Email" type="email" />
    <Input name="password" placeholder="Password" type="password" />
    <Button variant="default" type="submit">
      Sign in with Credentials
    </Button>
  </form>
  //
</>
```

try to sign in
so now we have oauth and credentials base
but we want a real data base to save our users data

---

database

prisma extension vscode

npm install prisma --save-dev

src/db/schema.prisma

```prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id       String @id @default(uuid())
  email    String @unique
  password String
}
```

src/db/data empty folder

DATABASE_URL="file:./data/dev.db"

```json package.json
  "prisma": {
    "schema": "src/db/schema.prisma"
  },

script
    "db:migrate": "npx prisma migrate dev"
```

npm run db:migrate, this will generate typescript types, migrations and dev.db and @prisma/client package
show the dev.db created
add db/data to git ignore
`*/db/data`

npm run db:studio

add a admin@admin.com, 1234
emphasize that never directly save password and always hash of it

now we want to implement it in credentials

```typescript db/utils/db.ts
import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const db = globalThis.prismaGlobal ?? prismaClientSingleton();

export default db;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = db;
```

```typescript

    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const user = await db.user.findFirst({
          where: { email: credentials.email, password: credentials.password },
        });

        if (!user) {
          throw new Error("Invalid credentials.");
        }

        return user;
      },
    }),
```

```typescript
<form
  action={async (formData) => {
    "use server";
    try {
      await signIn("credentials", formData);
    } catch (error) {
      if (isRedirectError(error)) {
        throw error;
      }
      console.log("Error during sign in", error);
    }
  }}
>
  <Input name="email" placeholder="Email" type="email" />
  <Input name="password" placeholder="Password" type="password" />
  <Button variant="default" type="submit">
    Sign in with Credentials
  </Button>
</form>
```
