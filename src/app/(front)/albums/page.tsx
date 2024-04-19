import { getAuthSession } from "@/app/api/auth/[...nextauth]/options";
import CreateAlbum from "@/components/CreateAlbum";
import UserAlbumClient from "@/components/user/UserAlbumClient";
import AlbumComponent from "@/components/user/UserAlbumComponent";
import prisma from "@/DB/db.config";
import { Plus } from "lucide-react";
import { Trykker } from "next/font/google";

type Props = {
  params: { name: string };
};

const Albums = async (props: Props) => {
  const formattedUrl = decodeURIComponent(props.params.name);
  const session = await getAuthSession();
  const userData = await prisma.user.findUnique({
    where: {
      username: formattedUrl,
    },
    include: {
      Album: {
        include: {
          Post: true,
        },
      },
    },
  });
  
  const isSelf = session?.user.id === userData?.id;
  return (
    <>
      <div className="flex flex-wrap gap-5 items-start mt-5">
        {isSelf && (
          <CreateAlbum>
            <div className="flex items-start flex-col">
              <div className="h-36 w-36 bg-[#dfe1e9] flex justify-center items-center rounded-md border border-black/10">
                <Plus />
              </div>
              <h3 className="font-semibold text-sm mt-1">Create album</h3>
            </div>
          </CreateAlbum>
        )}
        <UserAlbumClient albums={userData?.Album ?? []} isSelf={isSelf} />
      </div>
    </>
  );
};

export default Albums;
