import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import AuthForm from "@/components/auth/AuthForm";

export default async function Page() {
    const currentUser = await getCurrentUser();

    // User is already authenticated
    if (currentUser) {
        redirect("/");
    }

    // User is not authenticated
    return <AuthForm />;
}