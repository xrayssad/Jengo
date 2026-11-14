/** Cloudinary URLs can take a width transform. Other hosts are returned unchanged. */
export function sizedImage(url: string, widths: number[]) {
  const clean = widths.filter((w) => w > 0);
  if (!url || !clean.length) return { src: url };
  const upload = "/upload/";
  if (!url.includes("res.cloudinary.com") || !url.includes(upload)) return { src: url };
  const [head, tail] = url.split(upload);
  if (!tail || tail.startsWith("c_") || tail.includes(",")) return { src: url };
  const build = (w: number) => `${head}${upload}c_limit,f_auto,q_auto,w_${w}/${tail}`;
  const widest = clean[clean.length - 1];
  return {
    src: build(widest),
    srcSet: clean.map((w) => `${build(w)} ${w}w`).join(", "),
  };
}
