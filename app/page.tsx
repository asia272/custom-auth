import { redirect } from "next/navigation";

const page = async () => {
  // Temporary hardcoded authentication
  // Replace this later with your real session/auth logic.
  const user = {
    id: "user_123",
    name: "Asia Ashraf",
    email: "asia@example.com",
  };

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