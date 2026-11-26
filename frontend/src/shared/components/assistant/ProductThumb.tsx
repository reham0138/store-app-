const PLACEHOLDER = "/brand/logo/the-crown-anchor-logo-black.png";

export default function ProductThumb({ src, className }: { src?: string; className: string }) {
  return (
    <img
      src={src || PLACEHOLDER}
      alt=""
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null;
        event.currentTarget.src = PLACEHOLDER;
      }}
      className={`shrink-0 bg-white object-cover ${className}`}
    />
  );
}
