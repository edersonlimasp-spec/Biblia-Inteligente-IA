import type { CSSProperties } from "react";

type MelMood = "normal" | "feliz" | "saudade";

type MelMascotProps = {
  mood?: MelMood;
  className?: string;
  celebrate?: boolean;
};

const moodLabels: Record<MelMood, string> = {
  normal: "Mel, sua companheira de estudo bíblico, sorrindo e segurando uma Bíblia.",
  feliz: "Mel, sua companheira de estudo bíblico, feliz, com os olhos fechados e pequenos corações.",
  saudade: "Mel, sua companheira de estudo bíblico, com expressão saudosa e uma lágrima.",
};

export function MelMascot({
  mood = "normal",
  className,
  celebrate = false,
}: MelMascotProps) {
  const isHappy = mood === "feliz";
  const isSad = mood === "saudade";
  const motionStyle = celebrate
    ? ({ "--mel-motion-state": "running" } as CSSProperties)
    : ({ "--mel-motion-state": "paused" } as CSSProperties);

  return (
    <svg
      className={["mel-mascot", celebrate && "mel-mascot--celebrate", className]
        .filter(Boolean)
        .join(" ")}
      style={motionStyle}
      viewBox="0 0 240 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={moodLabels[mood]}
      aria-roledescription="ilustração"
    >
      <style>{`
        .mel-mascot .mel-bob {
          transform-box: fill-box;
          transform-origin: center bottom;
          animation: mel-celebrate-bob 720ms cubic-bezier(.34,1.56,.64,1) both;
          animation-play-state: var(--mel-motion-state, paused);
        }
        .mel-mascot .mel-heart {
          transform-box: fill-box;
          transform-origin: center;
          animation: mel-heart-pop 650ms cubic-bezier(.2,.8,.2,1) both;
          animation-play-state: var(--mel-motion-state, paused);
        }
        .mel-mascot .mel-heart--two { animation-delay: 100ms; }
        @keyframes mel-celebrate-bob {
          0%, 100% { transform: translateY(0) rotate(0); }
          35% { transform: translateY(-8px) rotate(-2deg); }
          68% { transform: translateY(1px) rotate(1deg); }
        }
        @keyframes mel-heart-pop {
          0% { opacity: 0; transform: scale(.45) translateY(5px); }
          55% { opacity: 1; transform: scale(1.12) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mel-mascot .mel-bob, .mel-mascot .mel-heart {
            animation: none;
          }
        }
      `}</style>

      <g className="mel-bob">
        {/* Little wool cloud body */}
        <g stroke="#E8DCC4" strokeWidth="3" strokeLinejoin="round">
          <circle cx="120" cy="151" r="40" fill="#FFF8EC" />
          <circle cx="91" cy="148" r="24" fill="#FFF8EC" />
          <circle cx="103" cy="125" r="24" fill="#FFF8EC" />
          <circle cx="128" cy="119" r="25" fill="#FFF8EC" />
          <circle cx="150" cy="133" r="24" fill="#FFF8EC" />
          <circle cx="152" cy="158" r="25" fill="#FFF8EC" />
          <circle cx="133" cy="174" r="23" fill="#FFF8EC" />
          <circle cx="106" cy="171" r="23" fill="#FFF8EC" />
          <circle cx="88" cy="162" r="20" fill="#FFF8EC" />
        </g>

        {/* Caramel ears */}
        <path
          d="M83 73C67 62 54 70 57 84C59 95 72 100 91 96L99 85L83 73Z"
          fill="#E8B98A"
          stroke="#D9A779"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M157 73C173 62 186 70 183 84C181 95 168 100 149 96L141 85L157 73Z"
          fill="#E8B98A"
          stroke="#D9A779"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path
          d="M72 79C67 77 65 81 69 86C72 89 77 91 82 91"
          stroke="#F4D5B4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M168 79C173 77 175 81 171 86C168 89 163 91 158 91"
          stroke="#F4D5B4"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Face and forehead fluff */}
        <ellipse
          cx="120"
          cy="91"
          rx="43"
          ry="48"
          fill="#F0CFA8"
          stroke="#D9B78F"
          strokeWidth="2.5"
        />
        <g fill="#FFF8EC" stroke="#E8DCC4" strokeWidth="2.5">
          <circle cx="97" cy="55" r="15" />
          <circle cx="111" cy="48" r="16" />
          <circle cx="127" cy="49" r="16" />
          <circle cx="142" cy="57" r="14" />
          <circle cx="120" cy="59" r="15" />
        </g>

        {/* Face */}
        {isHappy ? (
          <>
            <path
              d="M94 91C98 85 104 85 108 91"
              stroke="#49352E"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M132 91C136 85 142 85 146 91"
              stroke="#49352E"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            {isSad && (
              <>
                <path d="M94 79L108 82" stroke="#49352E" strokeWidth="3" strokeLinecap="round" />
                <path d="M132 82L146 79" stroke="#49352E" strokeWidth="3" strokeLinecap="round" />
              </>
            )}
            <ellipse cx="101" cy="91" rx="5.2" ry="7" fill="#49352E" />
            <ellipse cx="139" cy="91" rx="5.2" ry="7" fill="#49352E" />
            <ellipse cx="102.5" cy="88.5" rx="1.7" ry="2" fill="#FFF8EC" />
            <ellipse cx="140.5" cy="88.5" rx="1.7" ry="2" fill="#FFF8EC" />
          </>
        )}

        <ellipse cx="89" cy="105" rx="8" ry="4.5" fill="#E9A0A0" opacity=".75" />
        <ellipse cx="151" cy="105" rx="8" ry="4.5" fill="#E9A0A0" opacity=".75" />
        {isHappy ? (
          <path
            d="M113 105C113 100 120 100 120 105C120 100 127 100 127 105C127 111 120 115 120 115C120 115 113 111 113 105Z"
            fill="#B85E61"
          />
        ) : isSad ? (
          <>
            <path d="M113 112C117 107 123 107 127 112" stroke="#714A3D" strokeWidth="2.5" strokeLinecap="round" />
            <path
              d="M145 101C145 101 140 108 140 112C140 115 142 117 145 117C148 117 150 115 150 112C150 108 145 101 145 101Z"
              fill="#91C7D0"
              stroke="#77B5C0"
              strokeWidth="1.5"
            />
            <path d="M143 111C143 110 144 109 145 108" stroke="#E8F8F7" strokeWidth="1.5" strokeLinecap="round" />
          </>
        ) : (
          <path
            d="M111 105C115 111 125 111 129 105"
            stroke="#714A3D"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        )}

        {/* Tiny legs */}
        <path d="M99 178L96 195" stroke="#49352E" strokeWidth="8" strokeLinecap="round" />
        <path d="M140 178L143 195" stroke="#49352E" strokeWidth="8" strokeLinecap="round" />
        <path d="M91 197H101" stroke="#49352E" strokeWidth="6" strokeLinecap="round" />
        <path d="M138 197H148" stroke="#49352E" strokeWidth="6" strokeLinecap="round" />

        {/* Bible appears in every mood except saudade */}
        {!isSad && (
          <g transform="rotate(-7 127 158)">
            <path
              d="M116 138C124 136 132 138 139 142V174C132 170 124 169 116 172V138Z"
              fill="#263D5B"
              stroke="#1C304B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path
              d="M139 142C146 138 154 136 162 138V172C154 169 146 170 139 174V142Z"
              fill="#304C6B"
              stroke="#1C304B"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <path d="M139 142V174" stroke="#D8C6A8" strokeWidth="1.5" />
            <path d="M129 147V159M124 153H134" stroke="#D5AD62" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M120 164H132M146 164H157" stroke="#A9B5C0" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
          </g>
        )}
      </g>

      {isHappy && (
        <g fill="#D98284" aria-hidden="true">
          <path
            className="mel-heart"
            d="M68 119C68 115 73 113 76 118C79 113 84 115 84 119C84 124 76 129 76 129C76 129 68 124 68 119Z"
          />
          <path
            className="mel-heart mel-heart--two"
            d="M164 112C164 109 168 107 171 111C174 107 178 109 178 112C178 116 171 121 171 121C171 121 164 116 164 112Z"
          />
        </g>
      )}
    </svg>
  );
}