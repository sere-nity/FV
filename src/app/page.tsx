import Image from "next/image";
import { getCurrentUser, type FanvueUser } from "@/lib/fanvue";

export const dynamic = "force-dynamic";

const buttonClass =
  "inline-flex h-10 items-center gap-2 rounded-full bg-[#49f264] px-4 text-sm font-medium text-black transition-colors hover:bg-[#3bd954] cursor-pointer";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const me = await getCurrentUser();
  const params = await searchParams;
  const error =
    (typeof params.error_description === "string" && params.error_description) ||
    (typeof params.error === "string" && params.error) ||
    null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-6 px-6 py-16">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-lg font-semibold">fanvue-curator</h1>
        {me ? (
          <form action="/api/oauth/logout" method="post">
            <button className="text-sm underline-offset-4 hover:underline cursor-pointer">
              Log out
            </button>
          </form>
        ) : null}
      </header>

      {me ? (
        <Profile user={me} />
      ) : (
        <section className="flex flex-col items-start gap-4 rounded-lg border border-black/10 p-6 dark:border-white/15">
          <p className="text-sm text-black/70 dark:text-white/70">
            Sign in with your Fanvue creator account.
          </p>
          <a className={buttonClass} href="/api/oauth/login" target="_top">
            <Image aria-hidden src="/logo192.png" alt="" width={20} height={20} />
            Login with Fanvue
          </a>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </section>
      )}
    </main>
  );
}

function Profile({ user }: { user: FanvueUser }) {
  const stats = [
    { label: "Followers", value: user.fanCounts?.followersCount },
    { label: "Subscribers", value: user.fanCounts?.subscribersCount },
    { label: "Posts", value: user.contentCounts?.postCount },
  ].filter((s) => typeof s.value === "number");

  return (
    <section className="flex flex-col gap-5 rounded-lg border border-black/10 p-6 dark:border-white/15">
      <div className="flex items-center gap-4">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="size-14 rounded-full object-cover bg-black/5"
          />
        ) : (
          <div className="flex size-14 items-center justify-center rounded-full bg-black/5 text-lg font-semibold dark:bg-white/10">
            {(user.displayName ?? user.handle).charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold">{user.displayName ?? user.handle}</p>
          <p className="truncate text-sm text-black/60 dark:text-white/60">
            @{user.handle}
            {user.isCreator ? " · Creator" : ""}
          </p>
        </div>
      </div>

      {user.bio ? <p className="text-sm whitespace-pre-line">{user.bio}</p> : null}

      {stats.length > 0 ? (
        <dl className="grid grid-cols-3 gap-3 text-sm">
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-black/60 dark:text-white/60">{s.label}</dt>
              <dd className="font-medium tabular-nums">{s.value!.toLocaleString()}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <details className="text-sm">
        <summary className="cursor-pointer text-black/60 dark:text-white/60">
          Raw /users/me response
        </summary>
        <pre className="mt-2 overflow-auto rounded bg-black/5 p-3 text-xs dark:bg-white/5">
          {JSON.stringify(user, null, 2)}
        </pre>
      </details>
    </section>
  );
}
