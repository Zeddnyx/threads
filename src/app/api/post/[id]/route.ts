import prisma from "@/DB/db.config";
import { NextRequest, NextResponse } from "next/server";
import { CustomSession, authOptions } from "../../auth/[...nextauth]/options";
import { getServerSession } from "next-auth";
import { join } from "path";
import { rmSync } from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session: CustomSession | null = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ status: 401, message: "Un-Authorized" });
  }
  const post = await prisma.post.findUnique({
    where: {
      id: params.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      Comment: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      },
      Likes: {
        where: {
          user_id: session?.user?.id!,
        },
      },
    },
  });

  return NextResponse.json({ status: 200, data: post });
}

// * Delete Post

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session: CustomSession | null = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ status: 401, message: "Un-Authorized" });
  }

  const post = await prisma.post.findUnique({
    where: {
      id: params.id,
    },
  });

  if (post == null || post.user_id != session.user!.id!) {
    return NextResponse.json({ status: 401, message: "Un-Authorized" });
  }

  // * remove the file
  const dir = join(process.cwd(), "public", "/uploads");
  const path = dir + "/" + post?.image;
  rmSync(path, { force: true });

  await prisma.post.delete({
    where: {
      id: params.id,
    },
  });

  return NextResponse.json({
    status: 200,
    message: "Post deleted successfully!",
  });
}
