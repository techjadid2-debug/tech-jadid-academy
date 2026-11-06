import type { AppUser } from "@/lib/auth";

export function isSeller(user: AppUser): boolean {
  return user.role === "seller" || user.role === "admin";
}

export function canManageSellerStudent(
  viewer: Pick<AppUser, "id" | "role">,
  student: { role: string | null; createdBy: string | null },
): boolean {
  return (
    student.role === "student" &&
    (viewer.role === "admin" ||
      (viewer.role === "seller" && student.createdBy === viewer.id))
  );
}
