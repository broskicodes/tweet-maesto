import { Avatar, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    alt: "@rexan_wong",
    src: "https://unavatar.io/twitter/rexan_wong",
  },
  {
    alt: "@dillionverma",
    src: "https://unavatar.io/twitter/dillionverma",
  },
  {
    alt: "@0xPaulius",
    src: "https://unavatar.io/twitter/0xPaulius",
  },
  {
    alt: "@jackfriks",
    src: "https://unavatar.io/twitter/jackfriks",
  },
  {
    alt: "@braedenhall_",
    src: "https://unavatar.io/twitter/braedenhall_",
  },
];

export default function SocialProofUsers() {
  return (
    <div className="items-center flex gap-3">
      <div className="flex">
        {testimonials.map((testimonial, index) => (
          <Avatar
            key={testimonial.alt}
            className={`border-2 border-white ${index !== 0 ? "-ml-4" : ""}`}
          >
            <AvatarImage alt={testimonial.alt} src={testimonial.src} />
          </Avatar>
        ))}
      </div>
      <div>
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              fill="none"
              width="20"
              xmlns="http://www.w3.org/2000/svg"
              height="20"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon
                fill="currentColor"
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                className="text-yellow-500"
              />
            </svg>
          ))}
        </div>
        <span className="mt-1 text-sm font-semibold text-muted-foreground space-x-1">
          <span>Join</span>
          <span className="text-foreground">20+</span>
          <span>shippers</span>
        </span>
      </div>
    </div>
  );
}
