interface LogoProps {
  scale: number;
}

export const Logo = ({ scale }: LogoProps) => {
  return (
    <svg
      fill="none"
      width="40"
      xmlns="http://www.w3.org/2000/svg"
      height="40"
      viewBox="0 0 40 40"
      transform={`scale(${scale})`}
    >
      <circle r="10" cx="22.5" cy="27.8334" stroke="hsl(var(--primary))" strokeWidth="2.5" />
      <circle r="10" cx="17" cy="22.5" stroke="hsl(var(--primary))" strokeWidth="2.5" />
      <circle r="10" cx="27.8334" cy="22.5" stroke="hsl(var(--primary))" strokeWidth="2.5" />
      <circle r="10" cx="22.5" cy="17.1666" stroke="hsl(var(--primary))" strokeWidth="2.5" />
    </svg>
  );
};
