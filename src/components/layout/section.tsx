import ReactMarkdown from "react-markdown";

interface SectionProps {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export default function Section({
  id,
  title,
  subtitle,
  description,
  children,
  className,
}: SectionProps) {
  const sectionId = title ? title.toLowerCase().replace(/\s+/g, "-") : id;
  return (
    <section id={id || sectionId}>
      <div className={className}>
        <div className="relative container mx-auto px-4 py-16 max-w-6xl">
          <div className="text-center space-y-4 pb-6 mx-auto">
            {title && (
              <h2 className="font-bold uppercase text-primary text-center">
                {title}
              </h2>
            )}
            {subtitle && (
              <h3 className="mx-auto mt-4 max-w-xs text-3xl font-semibold sm:max-w-none sm:text-4xl">
                <ReactMarkdown
                  components={{
                    h3: ({ children }) => <span>{children}</span>,
                    em: ({ children }) => <em>{children}</em>,
                  }}
                >
                  {subtitle}
                </ReactMarkdown>
              </h3>
            )}
            {description && (
              <p className="mt-6 text-lg leading-8 text-slate-600 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
