import { usePetStore } from "../stores/petStore";
import notionaiCharacter from "../assets/notionai_character.png";

interface PetProps {
  onClick?: () => void;
}

/**
 * 펫 캐릭터 렌더러 — 노션 AI 캐릭터 이미지 + 상태 소품(스파클/zzz/연필) 오버레이.
 * 위치 고정이 꺼져 있을 때만 드래그로 이동할 수 있다.
 */
export default function Pet({ onClick }: PetProps) {
  const state = usePetStore((s) => s.state);
  const locked = usePetStore((s) => s.locked);

  return (
    <div
      className={`pet ${state}${locked ? " locked" : ""}`}
      onClick={onClick}
      {...(locked ? {} : { "data-tauri-drag-region": true })}
      role="img"
      aria-label="노션 펫"
    >
      <CharacterBody state={state} />
    </div>
  );
}

/** 몸통: 노션 AI 캐릭터 이미지 + 상태 소품(스파클/zzz/연필) 오버레이 */
function CharacterBody({ state }: { state: string }) {
  return (
    <div
      style={{ position: "relative", width: 120, height: 130, pointerEvents: "none" }}
    >
      <img
        src={notionaiCharacter}
        alt=""
        width="110"
        height="110"
        draggable={false}
        style={{
          position: "absolute",
          left: 5,
          top: 12,
          objectFit: "contain",
          filter: state === "sleeping" ? "grayscale(0.5) brightness(0.92)" : "none",
        }}
      />
      <svg
        width="120"
        height="130"
        viewBox="0 0 120 130"
        style={{ position: "absolute", inset: 0 }}
      >
        {state !== "sleeping" && (
          <g fill="#9065b0">
            <path
              className="pet-sparkle"
              d="M14 22 L16.5 29.5 L24 32 L16.5 34.5 L14 42 L11.5 34.5 L4 32 L11.5 29.5 Z"
            />
            <path
              className="pet-sparkle"
              d="M110 60 L111.8 65.2 L117 67 L111.8 68.8 L110 74 L108.2 68.8 L103 67 L108.2 65.2 Z"
            />
            <path
              className="pet-sparkle"
              d="M103 6 L104.4 10.1 L108.5 11.5 L104.4 12.9 L103 17 L101.6 12.9 L97.5 11.5 L101.6 10.1 Z"
            />
          </g>
        )}
        {state === "sleeping" && (
          <g className="pet-zzz" fill="#787774" fontFamily="inherit" fontWeight="700">
            <text x="92" y="30" fontSize="16">z</text>
            <text x="102" y="20" fontSize="12">z</text>
            <text x="110" y="12" fontSize="9">z</text>
          </g>
        )}
        {state === "working" && (
          <g transform="translate(92 76)">
            <g className="pet-pencil">
              <rect x="0" y="0" width="8" height="26" rx="1.5" fill="#f5b342" stroke="#37352f" strokeWidth="2" />
              <path d="M0 26 L4 34 L8 26 Z" fill="#f7e0b8" stroke="#37352f" strokeWidth="2" strokeLinejoin="round" />
              <rect x="0" y="-4" width="8" height="5" rx="1.5" fill="#e37c73" stroke="#37352f" strokeWidth="2" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
