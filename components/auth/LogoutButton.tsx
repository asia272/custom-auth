"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { logoutAction } from "@/actions/auth.actions";

export default function LogoutButton() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handleLogout = async () => {
        setLoading(true);

        try {
            const result = await logoutAction();

            if (result.success) {
                router.push("/auth");
                router.refresh();
            }
        } catch (error) {
            console.error("Logout error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleLogout}
            disabled={loading}
            variant="destructive"
        >
            {loading ? "Logging out..." : "Logout"}
        </Button>
    );
}