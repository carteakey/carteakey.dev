function normalizeFeaturedEntry(post) {
  const value = post.data?.featured;

  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    const enabled = value.enabled ?? true;
    if (!enabled) {
      return null;
    }
    return {
      post,
      weight: value.weight ?? value.order ?? value.priority ?? post.data?.featuredWeight ?? post.data?.featuredOrder ?? post.data?.featuredPriority,
    };
  }

  return {
    post,
    weight: post.data?.featuredWeight ?? post.data?.featuredOrder ?? post.data?.featuredPriority,
  };
}

function resolveDate(post) {
  const pinnedAt = post.data?.featuredAt ?? post.data?.pinnedAt;
  const updated = post.data?.updated;
  const source = pinnedAt ?? updated ?? post.date;
  const value = new Date(source).getTime();

  if (Number.isNaN(value)) {
    const fallback = post.date instanceof Date ? post.date.getTime() : Date.now();
    return fallback;
  }

  return value;
}

export default function featuredContent({ collections }) {
  const posts = collections?.posts ?? [];

  const featuredPosts = posts
    .map(normalizeFeaturedEntry)
    .filter(Boolean)
    .sort((a, b) => {
      const weightA = a.weight ?? Number.POSITIVE_INFINITY;
      const weightB = b.weight ?? Number.POSITIVE_INFINITY;

      if (weightA !== weightB) {
        return weightA - weightB;
      }

      return resolveDate(b.post) - resolveDate(a.post);
    })
    .map((entry) => entry.post);

  return {
    featuredPosts,
    featuredPost: featuredPosts[0] ?? null,
  };
}
