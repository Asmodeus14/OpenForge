import type { SVGProps } from "react";
import type { JSX } from "react/jsx-runtime";


const LogoSVG = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 512 512"
    width="512"
    height="512"
    {...props}
  >
    {/* LEFT EAR BASE */}
    <polygon points="140,110 95,70 135,185" fill="#8B5A2B" />
    {/* LEFT EAR FEATHERS */}
    <polygon points="140,110 115,90 130,135" fill="#A67C4F" />
    <polygon points="140,110 125,150 155,140" fill="#A67C4F" />

    {/* RIGHT EAR BASE */}
    <polygon points="372,110 417,70 377,185" fill="#8B5A2B" />
    {/* RIGHT EAR FEATHERS */}
    <polygon points="372,110 397,90 382,135" fill="#A67C4F" />
    <polygon points="372,110 387,150 357,140" fill="#A67C4F" />

    {/* HEAD BASE */}
    <polygon points="256,85 145,165 120,310 256,445 392,310 367,165" fill="#C89B6A" />

    {/* HEAD SHADING */}
    <polygon points="145,165 120,310 210,335 256,215" fill="#D6AE80" />
    <polygon points="367,165 392,310 302,335 256,215" fill="#B78353" />

    {/* FACIAL DISC (LEFT) */}
    <polygon points="256,155 180,215 205,285 256,305" fill="#F4EDE2" />

    {/* FACIAL DISC (RIGHT) */}
    <polygon points="256,155 332,215 307,285 256,305" fill="#EFE5D7" />

    {/* BROW RIDGES */}
    <polygon points="190,205 235,190 256,205 215,225" fill="#E2D2BE" />
    <polygon points="322,205 277,190 256,205 297,225" fill="#E2D2BE" />

    {/* LEFT EYE SOCKET */}
    <polygon points="205,220 185,245 205,270 225,245" fill="#2A2A2A" />
    <circle cx="210" cy="245" r="14" fill="#F5A623" />
    <circle cx="214" cy="241" r="4" fill="#FFFFFF" />

    {/* RIGHT EYE SOCKET */}
    <polygon points="307,220 327,245 307,270 287,245" fill="#2A2A2A" />
    <circle cx="302" cy="245" r="14" fill="#F5A623" />
    <circle cx="306" cy="241" r="4" fill="#FFFFFF" />

    {/* BEAK (INSET) */}
    <polygon points="256,255 242,285 256,305 270,285" fill="#3A3A3A" />

    {/* CHEST */}
    <polygon points="256,305 210,370 256,415 302,370" fill="#C08A57" />
    <polygon points="256,360 225,425 256,450 287,425" fill="#A96F3F" />

    {/* SHADOW */}
    <ellipse cx="256" cy="468" rx="78" ry="14" fill="#000000" opacity="0.14" />
  </svg>
);

export default LogoSVG;
