import { z } from 'zod'

export const credentialsSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1).optional(),
    mode: z.enum(["login", "signup"]),
});

export type CredentialsInput = z.infer<typeof credentialsSchema>;