import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

const page = async () => {


  const user = await getCurrentUser()

  // If user is not authenticated
  if (!user) {
    redirect("/auth");
  }

  return (
    <main>
      <h1>Welcome, {user.name} 👋</h1>

      <div>
        <p>Email: {user.email}</p>
        <p>User ID: {user.id}</p>
      </div>
    </main>
  );
};

export default page;