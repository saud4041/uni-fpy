todo:
zod in credentials
add sign up for credentials
seed
what happens when a oauth user trys to sign in with github or vice versa
https://authjs.dev/getting-started/session-management/protecting
enhance ts

<!--  -->

---

npx create-next-app@latest .
.nvmrc
npm install next-auth@beta
npx auth secret
npx shadcn@latest init (default, neutral)

npx shadcn@latest add button

```ts page.tsx
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

```ts
import NextAuth from "next-auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [],
});
```

app/api/auth/[...nextauth]/route.ts

```ts
import { handlers } from "@/app/(auth)/_utils/auth";
export const { GET, POST } = handlers;
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

```ts
  providers: [GitHub],
```

```ts (auth)/sign-in/_components/sign-in.tsx
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

```ts app/(auth)/sign-in/page.tsx
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

```ts (auth)/_components/sign-out
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

```ts
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

```ts
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

npm run db:migrate, this will generate ts types, migrations and dev.db and @prisma/client package
show the dev.db created
add db/data to git ignore
`*/db/data`

npm run db:studio

add a admin@admin.com, 1234
emphasize that never directly save password and always hash of it

now we want to implement it in credentials

```ts db/utils/db.ts
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

```ts

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

```ts
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

---

npm i @auth/prisma-adapter

```ts
adapter: PrismaAdapter(db),
```

```prisma
model User {
  id            String          @id @default(cuid())
  name          String?
  email         String?         @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  // Optional for WebAuthn support
  Authenticator Authenticator[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@unique([identifier, token])
}

// Optional for WebAuthn support
model Authenticator {
  credentialID         String  @unique
  userId               String
  providerAccountId    String
  credentialPublicKey  String
  counter              Int
  credentialDeviceType String
  credentialBackedUp   Boolean
  transports           String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([userId, credentialID])
}

```

"db:reset": "prisma migrate reset && prisma migrate dev",

npm run db:reset

go to github and revoke all users and again sign in with github
show full session

npm run db:studio
see new things added

lets enhance things

npm i zod
/sign-in/\_types/schema.ts

const schema = z.object({
email: z.string().email(),
password: z.string().min(1),
});

```ts auth.ts
const validatedCredentials = await schema.parseAsync(credentials);

const user = await db.user.findFirst({
  where: {
    email: validatedCredentials.email,
    password: validatedCredentials.password,
  },
});
```

add password to user prisma
npm run db:reset
errors are gone
we want register user by credentials

```ts sign-up/_components/sign-up.tsx
const SignUp = () => {
  return (
    <form
      action={async (formData) => {
        "use server";
        await signUp(formData);
        redirect("/sign-in");
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
```

db/utils/executeAction.ts

```ts
type Options<T> = {
  actionFn: () => Promise<T>;
  successMessage?: string;
};

const executeAction = async <T>({
  actionFn,
  successMessage = "The actions was successful",
}: Options<T>): Promise<{ success: boolean; message: string }> => {
  try {
    await actionFn();

    return {
      success: true,
      message: successMessage,
    };
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      success: false,
      message: "An error has occurred during executing the action",
    };
  }
};
```

sign-up/\_types/schema.ts

```ts
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type Schema = z.infer<typeof schema>;
```

sign-up/\_services/actions.ts

```ts
const signUp = async (formData: FormData) => {
  return executeAction({
    actionFn: async () => {
      const email = formData.get("email");
      const password = formData.get("password");
      const validatedData = schema.parse({ email, password });
      await db.user.create({
        data: {
          email: validatedData.email.toLocaleLowerCase(),
          password: validatedData.password,
        },
      });
    },
    successMessage: "Signed up successfully",
  });
};
```

now go to sign-up and import signUp

```ts sign-in/pages.tsx
<>
  <SignIn />
  <Button asChild>
    <Link href="/sign-up">Sign Up</Link>
  </Button>
</>
```

```ts sign-up/page.tsx
const Page = () => {
  return <SignUp />;
};
```

when it comes to sign in with credentials with auth js with database session things become a little complete because we need to expand the auth config

```ts
callbacks: {
  async jwt({ token, account }) {
    if (account?.provider === "credentials") {
      token.credentials = true;
    }
    return token;
  },
},
```

show what callbacks returns

```ts
const adapter = PrismaAdapter(db);

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter,
```

```ts
jwt: {
  encode: async function (params) {
    if (params.token?.credentials) {
      const sessionToken = uuid();

      if (!params.token.sub) {
        throw new Error("No user ID found in token");
      }

      const createdSession = await adapter?.createSession?.({
        sessionToken: sessionToken,
        userId: params.token.sub,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      if (!createdSession) {
        throw new Error("Failed to create session");
      }

      return sessionToken;
    }
    return defaultEncode(params);
  },
},
```

make below better

```ts sign-in.tsx
"use server";
await executeAction({
  actionFn: async () => {
    await signIn("credentials", formData);
  },
});
```
