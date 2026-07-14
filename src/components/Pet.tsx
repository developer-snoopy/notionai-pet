import { usePetStore } from "../stores/petStore";

interface PetProps {
  onClick?: () => void;
}

/** 노션 AI 스타일 캐릭터 — 모서리 접힌 문서 페이지 + AI 스파클 (오리지널 디자인, 잉크 스타일) */
export default function Pet({ onClick }: PetProps) {
  const state = usePetStore((s) => s.state);

  return (
    <div
      className={`pet ${state}`}
      onClick={onClick}
      data-tauri-drag-region
      role="img"
      aria-label="노션 펫"
    >
      <svg
        width="120"
        height="130"
        viewBox="0 0 120 130"
        data-tauri-drag-region
        style={{ pointerEvents: "none" }}
      >
        {/* 몸통 (모서리 접힌 문서 페이지) */}
        <path
          d="M36 14
             L 78 14
             L 96 32
             L 96 104
             Q 96 116, 84 116
             L 36 116
             Q 24 116, 24 104
             L 24 26
             Q 24 14, 36 14 Z"
          fill="#ffffff"
          stroke="#37352f"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* 접힌 귀퉁이 */}
        <path
          d="M78 14 L 96 32 L 78 32 Z"
          fill="#f1f0ee"
          stroke="#37352f"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* 문서 텍스트 라인 */}
        <g stroke="#d3d1cb" strokeWidth="3" strokeLinecap="round">
          <line x1="38" y1="96" x2="76" y2="96" />
          <line x1="38" y1="104" x2="62" y2="104" />
        </g>
        {/* AI 스파클 */}
        {state !== "sleeping" && (
          <g fill="#9065b0">
            <path
              className="pet-sparkle"
              d="M14 30 L16.5 37.5 L24 40 L16.5 42.5 L14 50 L11.5 42.5 L4 40 L11.5 37.5 Z"
            />
            <path
              className="pet-sparkle"
              d="M106 66 L107.8 71.2 L113 73 L107.8 74.8 L106 80 L104.2 74.8 L99 73 L104.2 71.2 Z"
            />
            <path
              className="pet-sparkle"
              d="M103 8 L104.4 12.1 L108.5 13.5 L104.4 14.9 L103 19 L101.6 14.9 L97.5 13.5 L101.6 12.1 Z"
            />
          </g>
        )}
        {/* 볼터치 */}
        <ellipse cx="40" cy="70" rx="7" ry="4.5" fill="#f5c8c2" />
        <ellipse cx="80" cy="70" rx="7" ry="4.5" fill="#f5c8c2" />
        {/* 눈 */}
        {state === "sleeping" ? (
          <g>
            <path
              d="M38 55 Q 44 59, 50 55"
              fill="none"
              stroke="#37352f"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M70 55 Q 76 59, 82 55"
              fill="none"
              stroke="#37352f"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </g>
        ) : (
          <g className="pet-eye">
            <circle cx="44" cy="54" r="5.5" fill="#37352f" />
            <circle cx="76" cy="54" r="5.5" fill="#37352f" />
            <circle cx="46" cy="52" r="1.8" fill="#fff" />
            <circle cx="78" cy="52" r="1.8" fill="#fff" />
          </g>
        )}
        {/* 입 */}
        {state === "talking" ? (
          <ellipse cx="60" cy="72" rx="7" ry="9" fill="#37352f" />
        ) : state === "sleeping" ? (
          <ellipse cx="60" cy="73" rx="4" ry="5" fill="#37352f" />
        ) : (
          <path
            d="M52 70 Q 60 78, 68 70"
            fill="none"
            stroke="#37352f"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}
        {/* 잠자기: zzz */}
        {state === "sleeping" && (
          <g className="pet-zzz" fill="#787774" fontFamily="inherit" fontWeight="700">
            <text x="92" y="30" fontSize="16">z</text>
            <text x="102" y="20" fontSize="12">z</text>
            <text x="110" y="12" fontSize="9">z</text>
          </g>
        )}
        {/* 작업 중: 연필 */}
        {state === "working" && (
          <g transform="translate(88 76)">
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
