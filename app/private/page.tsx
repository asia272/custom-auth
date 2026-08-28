import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function PrivatePage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth");
    }

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold">
                Private Page
            </h1>

            <p className="mt-4">
                Welcome, {user.name}
            </p>

            <p>{user.email}</p>

            <p>Role: {user.role}</p>

            <div className="mt-6">
                <LogoutButton />
            </div>
        </div>
    );
}