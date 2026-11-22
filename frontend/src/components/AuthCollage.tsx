"use client";

import Image from "next/image";

const photos = [
  { src: "/real/room.jpg", eager: true },
  { src: "/real/apartment.jpg" },
  { src: "/real/shop.jpg" },
  { src: "/real/warehouse.jpg" },
  { src: "/real/materials.jpg" },
];

export default function AuthCollage() {
  return (
    <div className="auth-collage" aria-hidden>
      {photos.map((photo, index) => (
        <div key={photo.src} className={`auth-bubble auth-bubble-${index}`}>
          <Image src={photo.src} alt="" fill priority={Boolean(photo.eager)} loading={photo.eager ? undefined : "lazy"} sizes="96px" />
        </div>
      ))}
    </div>
  );
}
