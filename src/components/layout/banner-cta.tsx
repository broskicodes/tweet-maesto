import { ChevronRight } from "lucide-react";
import Link from "next/link";

const BannerCTA = () => {
  return (
    <Link
      href="https://tweetmaestro.tolt.io"
      target="_blank"
      className="group relative top-0 bg-primary py-2 text-primary-foreground transition-all duration-300 md:py-3 block"
    >
      <div className="container justify-center h-full flex items-center text-sm">
        ✨
        <span className="ml-1 font-medium">
          <span className="md:hidden">Join our new Affiliate Program!</span>
          <span className="hidden md:inline">
            Join our Affiliate Program and earn 25% on each sale!
          </span>
        </span>
        <ChevronRight className="ml-1 h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
      </div>
    </Link>
  );
};

export default BannerCTA;
