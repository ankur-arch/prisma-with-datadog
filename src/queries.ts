import { tracer, x } from "./tracer";
import { tracedPrisma } from "./client";

console.log(x);

const prisma = tracedPrisma;

async function main() {
  const span = tracer.startSpan("queries");
  // Create unique emails
  const user1Email = `alice${Date.now()}@prisma.io`;
  const user2Email = `bob${Date.now()}@prisma.io`;

  // Create both users concurrently with their posts
  const [alice, bob] = await Promise.all([
    prisma.user.create({
      data: {
        email: user1Email,
        name: "Alice",
        posts: {
          create: {
            title: "Join the Prisma community on Discord",
            content: "https://pris.ly/discord",
            published: true,
          },
        },
      },
      include: { posts: true },
    }),
    prisma.user.create({
      data: {
        email: user2Email,
        name: "Bob",
        posts: {
          create: [
            {
              title: "Check out Prisma on YouTube",
              content: "https://pris.ly/youtube",
              published: true,
            },
            {
              title: "Follow Prisma on Twitter",
              content: "https://twitter.com/prisma/",
              published: false,
            },
          ],
        },
      },
      include: { posts: true },
    }),
  ]);

  console.log(
    `Created users: ${alice.name} (${alice.posts.length} post) and ${bob.name} (${bob.posts.length} posts)`
  );

  // Retrieve all published posts
  const publishedPosts = await prisma.post.findMany({
    where: { published: true },
  });
  // console.log("Published posts:", publishedPosts);

  // Create an unpublished post for Alice then publish it
  let post = await prisma.post.create({
    data: {
      title: "Join the Prisma Discord community",
      content: "https://pris.ly/discord",
      published: false,
      author: { connect: { email: user1Email } },
    },
  });
  post = await prisma.post.update({
    where: { id: post.id },
    data: { published: true },
  });
  console.log("Newly published post:", post);

  // Retrieve all posts by Alice
  const alicePosts = await prisma.post.findMany({
    where: { author: { email: user1Email } },
  });

  span.finish();
  // console.log("Alice's posts:", alicePosts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
