import { BackgroundPaths } from "@/components/ui/background-path";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative h-screen">
        <div className="flex items-center justify-center h-full">
    <BackgroundPaths title="HUSTLE TOOLS" />
  </div>
      <footer className="absolute bottom-4 text-center w-full text-xs text-foreground/50">
        <p>This website is developed by Hustle Together LLC, made with love ❤️.</p>
      </footer>
    </div>
  );
}
