import { prisma } from "@/utils/prisma";
import { getAuthSession } from "@/app/api/auth/[...nextauth]/options";
import { createAlbumValidator } from "@/validators/album";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const body = await req.json();

    const { name, description } = createAlbumValidator.parse(body);

    const album = await prisma.album.create({
      data: {
        user_id: session.user.id,
        name,
        description,
      },
    });

    return new Response(JSON.stringify(album));
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

export async function PATCH(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const body = await req.json();

    const { name, description, id } = createAlbumValidator.parse(body);

    const album = await prisma.album.update({
      where: {
        id: id,
      },
      data: {
        name,
        description,
      },
    });

    return new Response(JSON.stringify(album));
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

export async function DELETE(req: Request) {
  try {
    const session = await getAuthSession();

    if (!session?.user) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const { id, userId } = (await req.json()) as {
      id: string;
      userId: string | null;
    };

    if (id === "user-profile-image" || id === "user-banner-image") {
      return new Response("Cannot delete default album", { status: 403 });
    }

    if (userId && userId !== session.user.id) {
      return new Response("Cannot delete another user album", { status: 403 });
    }

    await prisma.album.delete({
      where: {
        id: id,
        user_id: {
          not: "null",
        },
      },
    });

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
