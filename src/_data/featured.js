export default function featuredContent({ collections }) {
  const posts = collections?.posts ?? [];
  const featuredPosts = posts.filter((post) => post.data?.featured);

  return {
    featuredPosts,
    featuredPost: featuredPosts[0] ?? null,
  };
}
