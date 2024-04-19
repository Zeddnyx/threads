import { prisma } from "@/utils/prisma";
import { getAuthSession } from "@/app/api/auth/[...nextauth]/options";
import { PostValidator } from "@/validators/post";
import { z } from "zod";

export async function POST(req: Request) {
  const url = new URL(req.url);

  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const { album } = z
      .object({
        album: z.string().nullable().optional(),
      })
      .parse({
        album: url.searchParams.get("album"),
      });

    const body = await req.json();

    const { userId, title, description, content } = PostValidator.parse(body);

    // console.log(content.blocks[0].data.text);

    const imageData: { url: string; caption: string }[] = [];

    // Iterate through each block
    content.blocks.forEach((block: any) => {
      // Check if the block type is "image"
      if (block.type === "image") {
        // Extract URL and caption from data object
        const url: string = block.data.file.url;
        const caption: string = block.data.caption;

        // Push URL and caption pair as an object into the array
        imageData.push({ url, caption });
      }
    });

    if (album) {
      const createdPost = await prisma.post.create({
        data: {
          albumId: album,
          userId,
        },
      });

      if (imageData.length !== 0) {
        for (const photo of imageData) {
          await prisma.post.create({
            data: {
              post: photo.url,
              caption: photo.caption,
              userId: userId,
              albumId: album,
              postId: createdPost.id, // Associate the photo with the created post
            },
          });
        }
      }
    } else {
      const createdPost = await prisma.post.create({
        data: {
          title,
          description,
          userId,
        },
      });

      if (imageData.length !== 0) {
        for (const photo of imageData) {
          await prisma.photo.create({
            data: {
              photo: photo.url,
              caption: photo.caption,
              userId: userId,
              postId: createdPost.id, // Associate the photo with the created post
            },
          });
        }
      }
    }

    return new Response("OK");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response("Invalid request data passed", { status: 422 });
    }

    return new Response(
      "Could not post to breadit at this time, please try again later.",
      { status: 500 }
    );
  }
}
