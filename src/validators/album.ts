import { z } from "zod";

export const createAlbumValidator = z.object({
  name: z
    .string()
    .min(3, { message: "Album name must be longer than 3 characters" }),
  description: z.string().nullable(),
  id: z.string().optional(),
});

export type CreateAlbumValidator = z.infer<typeof createAlbumValidator>;
