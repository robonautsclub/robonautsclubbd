import Script from "next/script";

type Props = {
  id: string;
  data: unknown;
};

export default function JsonLdScript({ id, data }: Props) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
