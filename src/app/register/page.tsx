import { redirect } from "next/navigation";
import { COURSES } from "@/lib/course-data";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course } = await searchParams;
  const validCourse = COURSES.some((item) => item.slug === course) ? course : "";
  redirect(validCourse ? `/?course=${encodeURIComponent(validCourse)}#lead` : "/#lead");
}
