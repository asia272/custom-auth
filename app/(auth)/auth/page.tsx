"use client";

import { useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import SignUpForm from "@/components/auth/SignUpForm";


export default function Page() {
    const [showLogin, setShowLogin] = useState(true);




    return (
        <main className="flex min-h-screen items-center justify-center p-6">
            <div className="w-full max-w-md">
                {showLogin ? (
                    <>
                        <LoginForm />

                        <p className="mt-4 text-center text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <button
                                type="button"
                                onClick={() => setShowLogin(false)}
                                className="font-medium text-primary hover:underline"
                            >
                                Sign Up
                            </button>
                        </p>
                    </>
                ) : (
                    <>

                        <SignUpForm />

                        <p className="mt-4 text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => setShowLogin(true)}
                                className="font-medium text-primary hover:underline"
                            >
                                Login
                            </button>
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}