import type { FanvueUser } from "@/lib/fanvue";

export function Profile({ user }: { user: FanvueUser }) {
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
