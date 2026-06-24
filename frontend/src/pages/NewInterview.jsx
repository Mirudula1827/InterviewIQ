import { PlusCircle } from "lucide-react";
import PlaceholderPage from "../components/layout/PlaceholderPage";

export default function NewInterview() {
  return (
    <PlaceholderPage
      icon={PlusCircle}
      title="New Interview Coming Soon"
      description="Configure a new mock interview by uploading your resume and selecting a role."
    />
  );
}
