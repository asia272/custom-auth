import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/auth");
    }

    if (user.role !== "ADMIN") {
        redirect("/");
    }

    return (
        <div>
            <h1>Admin Dashboard</h1>

            <p>Welcome, {user.name}</p>
        </div>
    );
}