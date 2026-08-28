"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { loginAction } from "@/actions/auth.actions";

const LoginForm = () => {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        setError("");
        setLoading(true);

        const formData = new FormData(e.currentTarget);

        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        if (!email || !password) {
            setError("Please enter email and password.");
            setLoading(false);
            return;
        }

        try {
            const result = await loginAction(
                email,
                password
            );

            if (!result.success) {
                setError(result.message);
                return;
            }

            // Login successful
            router.push("/private");
            router.refresh();
        } catch (error) {
            console.error("Login error:", error);
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="text-2xl">
                    Login
                </CardTitle>

                <CardDescription>
                    Enter your email and password to continue.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    {error && (
                        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">
                            Email
                        </Label>

                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">
                            Password
                        </Label>

                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default LoginForm;