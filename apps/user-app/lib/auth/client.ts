import { signIn } from "next-auth/react";

export async function login(email: string, password: string) {
    return signIn("credentials", {
        email,
        password,
        mode: "login",
        redirect: false,
    });
}

export async function signup(
    name: string,
    email: string,
    password: string
) {
    return signIn("credentials", {
        name,
        email,
        password,
        mode: "signup",
        redirect: false,
    });
}
