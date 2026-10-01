import type { CSSProperties } from "react";
import "./MelMascot.css";

export type MelScene =
  | "idle"
  | "welcome"
  | "morning"
  | "continue"
  | "reading"
  | "complete"
  | "milestone"
  | "saudade"
  | "sleeping"
  | "praying"
  | "peeking";

type MelMood = "normal" | "feliz" | "saudade";

type MelMascotProps = {
  mood?: MelMood;
  className?: string;
  celebrate?: boolean;
  scene?: MelScene;
  reference?: string;
  milestone?: number;
  interaction?: boolean;
};

const sceneLabels: Record<MelScene, string> = {
  idle: "sorrindo e segurando uma Bíblia",
  welcome: "acenando para dar boas-vindas",
  morning: "acordando com o nascer do sol",
  continue: "pulando em direção à sua leitura",
  reading: "lendo sua Bíblia",
  complete: "celebrando sua leitura com alegria",
  milestone: "celebrando um marco de leitura",
  saudade: "com expressão saudosa e uma lágrima",
  sleeping: "dormindo tranquilamente",
  praying: "orando com as patas juntas",
  peeking: "espiando com curiosidade",
};

export function MelMascot({
  mood = "normal",
  className,
  celebrate = false,
  scene,
  reference = "João 3",
  milestone = 7,
  interaction = false,
}: MelMascotProps) {
  const currentScene = scene ?? (mood === "saudade" ? "saudade" : celebrate ? "complete" : "idle");
  const isSad = currentScene === "saudade" || (scene === undefined && mood === "saudade");
  const isSleeping = currentScene === "sleeping";
  const isPraying = currentScene === "praying";
  const isReading = currentScene === "reading";
  const isHappy = currentScene === "complete" || currentScene === "milestone" || mood === "feliz";
  const motionStyle = { "--mel-motion-state": "running" } as CSSProperties;
  const classes = [
    "mel-mascot",
    `mel-mascot--${currentScene}`,
    celebrate && "mel-mascot--celebrate",
    interaction && "mel-mascot--interaction",
    className,
  ].filter(Boolean).join(" ");

  return (
    <svg
      className={classes}
      style={motionStyle}
      viewBox="0 0 240 250"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`Mel, sua companheira de estudo bíblico, ${sceneLabels[currentScene]}.`}
      aria-roledescription="ilustração"
      data-scene={currentScene}
    >
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .mel-mascot, .mel-mascot * {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      {currentScene === "morning" && (
        <g className="mel-sun" aria-hidden="true">
          <path d="M22 73H218" stroke="#E9C66F" strokeWidth="2" strokeDasharray="3 7" opacity=".55" />
          <circle cx="190" cy="53" r="17" fill="#F5D989" />
          <path d="M190 27V20M190 86V79M164 53H157M223 53H216M171 34L166 29M214 77L209 72M209 34L214 29"
            stroke="#E9C66F" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      )}

      {currentScene === "continue" && (
        <g className="mel-reference" aria-hidden="true">
          <path d="M196 87V149" stroke="#7AAFC0" strokeWidth="2" strokeDasharray="3 5" />
          <path d="M185 87H207L203 106L196 113L189 106L185 87Z" fill="#82BDCE" stroke="#5593A4" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="196" cy="96" r="3" fill="#F8F1E4" />
          <text x="196" y="77" textAnchor="middle" className="mel-reference-label">
            {reference}
          </text>
        </g>
      )}

      {isPraying && <circle className="mel-prayer-light" cx="120" cy="129" r="76" aria-hidden="true" />}

      {currentScene === "milestone" && (
        <g className="mel-badge" aria-hidden="true">
          <circle cx="190" cy="54" r="30" fill="#F5E8C8" stroke="#D9B66C" strokeWidth="2.5" />
          <circle cx="190" cy="54" r="25" stroke="#D9B66C" strokeWidth="1.5" strokeDasharray="2 3" />
          <path d="M190 31L193 37L200 38L195 43L196 49L190 46L184 49L185 43L180 38L187 37L190 31Z" fill="#D5AD62" />
          <text x="190" y="63" textAnchor="middle" className="mel-badge-days">{milestone}</text>
          <text x="190" y="73" textAnchor="middle" className="mel-badge-label">dias</text>
        </g>
      )}

      <g className="mel-interaction-body">
      <g className="mel-character">
        <circle className="mel-tail" cx="174" cy="169" r="11" fill="#FFF8EC" stroke="#E8DCC4" strokeWidth="2.5" />
        <g className="mel-ears">
          <g className="mel-ear mel-ear--left">
            <path d="M83 73C67 62 54 70 57 84C59 95 72 100 91 96L99 85L83 73Z"
              fill="#E8B98A" stroke="#D9A779" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M72 79C67 77 65 81 69 86C72 89 77 91 82 91"
              stroke="#F4D5B4" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <g className="mel-ear mel-ear--right">
            <path d="M157 73C173 62 186 70 183 84C181 95 168 100 149 96L141 85L157 73Z"
              fill="#E8B98A" stroke="#D9A779" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M168 79C173 77 175 81 171 86C168 89 163 91 158 91"
              stroke="#F4D5B4" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>

        <g className="mel-wool">
          <g stroke="#E8DCC4" strokeWidth="3" strokeLinejoin="round" fill="#FFF8EC">
            <circle cx="120" cy="151" r="40" />
            <circle cx="91" cy="148" r="24" />
            <circle cx="103" cy="125" r="24" />
            <circle cx="128" cy="119" r="25" />
            <circle cx="150" cy="133" r="24" />
            <circle cx="152" cy="158" r="25" />
            <circle cx="133" cy="174" r="23" />
            <circle cx="106" cy="171" r="23" />
            <circle cx="88" cy="162" r="20" />
          </g>
        </g>

        <g className="mel-head">
          <ellipse cx="120" cy="91" rx="43" ry="48" fill="#F0CFA8" stroke="#D9B78F" strokeWidth="2.5" />
          <g fill="#FFF8EC" stroke="#E8DCC4" strokeWidth="2.5">
            <circle cx="97" cy="55" r="15" />
            <circle cx="111" cy="48" r="16" />
            <circle cx="127" cy="49" r="16" />
            <circle cx="142" cy="57" r="14" />
            <circle cx="120" cy="59" r="15" />
          </g>

          {isSad && (
            <>
              <path d="M94 79L108 82M132 82L146 79" stroke="#49352E" strokeWidth="3" strokeLinecap="round" />
              <path d="M113 112C117 107 123 107 127 112" stroke="#714A3D" strokeWidth="2.5" strokeLinecap="round" />
              <path className="mel-tear" d="M145 101C145 101 140 108 140 112C140 115 142 117 145 117C148 117 150 115 150 112C150 108 145 101 145 101Z"
                fill="#91C7D0" stroke="#77B5C0" strokeWidth="1.5" />
              <path d="M143 111C143 110 144 109 145 108" stroke="#E8F8F7" strokeWidth="1.5" strokeLinecap="round" />
            </>
          )}

          {isSleeping || isPraying || currentScene === "complete" || currentScene === "milestone" ||
          (scene === undefined && mood === "feliz") ? (
            <>
              <path d="M94 91C98 97 104 97 108 91M132 91C136 97 142 97 146 91"
                stroke="#49352E" strokeWidth="3.2" strokeLinecap="round" />
              {isSleeping && <path className="mel-sleep-blush" d="M113 108C116 105 124 105 127 108"
                stroke="#714A3D" strokeWidth="2.5" strokeLinecap="round" />}
            </>
          ) : (
            <g className="mel-eyes">
              <g className="mel-eye-open">
                <ellipse cx="101" cy="91" rx="5.2" ry="7" fill="#49352E" />
                <ellipse cx="139" cy="91" rx="5.2" ry="7" fill="#49352E" />
                <ellipse cx="102.5" cy="88.5" rx="1.7" ry="2" fill="#FFF8EC" />
                <ellipse cx="140.5" cy="88.5" rx="1.7" ry="2" fill="#FFF8EC" />
              </g>
              <g className="mel-eye-blink">
                <path d="M94 91C98 95 104 95 108 91M132 91C136 95 142 95 146 91"
                  stroke="#49352E" strokeWidth="3.2" strokeLinecap="round" />
              </g>
            </g>
          )}

          <ellipse cx="89" cy="105" rx="8" ry="4.5" fill="#E9A0A0" opacity=".75" />
          <ellipse cx="151" cy="105" rx="8" ry="4.5" fill="#E9A0A0" opacity=".75" />
          {isHappy ? (
            <path d="M111 104C113 99 119 100 120 105C122 100 128 99 129 104C130 111 120 116 120 116C120 116 110 111 111 104Z"
              fill="#B85E61" />
          ) : isSad ? null : (
            <path d="M111 105C115 111 125 111 129 105" stroke="#714A3D" strokeWidth="2.8" strokeLinecap="round" />
          )}
          {currentScene === "morning" && (
            <path className="mel-yawn" d="M114 105C114 101 126 101 126 105C126 112 124 115 120 115C116 115 114 112 114 105Z"
              fill="#714A3D" />
          )}
        </g>

        <g className="mel-legs" stroke="#49352E" strokeLinecap="round">
          <path d="M99 178L96 195M140 178L143 195" strokeWidth="8" />
          <path d="M91 197H101M138 197H148" strokeWidth="6" />
        </g>

        {currentScene === "welcome" && (
          <g className="mel-wave-paw" aria-hidden="true">
            <path d="M158 150C168 148 172 140 174 131L178 113C179 108 186 109 187 114L187 126L193 115C196 110 202 114 200 119L194 135C191 147 184 157 170 162Z"
              fill="#F0CFA8" stroke="#D9B78F" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M179 117L177 109M187 119L189 111M195 122L200 116" stroke="#D9B78F" strokeWidth="2" strokeLinecap="round" />
          </g>
        )}
        {isPraying && (
          <g className="mel-praying-paws" aria-hidden="true">
            <path d="M105 143C110 136 116 135 120 142C124 135 130 136 135 143L130 163C127 169 122 171 120 165C118 171 113 169 110 163Z"
              fill="#F0CFA8" stroke="#D9B78F" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M120 144V164" stroke="#D9B78F" strokeWidth="1.5" strokeLinecap="round" />
          </g>
        )}

        {!isSad && !isPraying && (
          <g className={`mel-bible ${isReading ? "mel-bible--open" : ""}`}>
            <path d="M116 138C124 136 132 138 139 142V174C132 170 124 169 116 172V138Z"
              fill="#263D5B" stroke="#1C304B" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M139 142C146 138 154 136 162 138V172C154 169 146 170 139 174V142Z"
              fill="#304C6B" stroke="#1C304B" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M139 142V174" stroke="#D8C6A8" strokeWidth="1.5" />
            <path d="M129 147V159M124 153H134" stroke="#D5AD62" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M120 164H132M146 164H157" stroke="#A9B5C0" strokeWidth="1.2" strokeLinecap="round" opacity=".8" />
            {isReading && (
              <>
                <path className="mel-page-turn" d="M140 143C147 139 154 138 160 139V169C153 168 147 170 140 173V143Z"
                  fill="#F8F1E4" stroke="#D8C6A8" strokeWidth="1.5" />
                <path d="M144 149H155M144 154H155M144 159H153" stroke="#B8A987" strokeWidth="1.2" strokeLinecap="round" />
              </>
            )}
          </g>
        )}
      </g>
      </g>

      {currentScene === "sleeping" && <text className="mel-zzz" x="167" y="73" aria-hidden="true">Zzz</text>}

      {(isHappy || interaction) && (
        <g className="mel-hearts" fill="#D98284" aria-hidden="true">
          <path className="mel-heart mel-heart--one" d="M68 119C68 115 73 113 76 118C79 113 84 115 84 119C84 124 76 129 76 129C76 129 68 124 68 119Z" />
          <path className="mel-heart mel-heart--two" d="M164 112C164 109 168 107 171 111C174 107 178 109 178 112C178 116 171 121 171 121C171 121 164 116 164 112Z" />
        </g>
      )}
      {currentScene === "milestone" && (
        <g className="mel-confetti" aria-hidden="true">
          <path className="mel-confetti-piece mel-confetti-piece--one" d="M53 79L58 72" stroke="#D5AD62" strokeWidth="3" strokeLinecap="round" />
          <path className="mel-confetti-piece mel-confetti-piece--two" d="M77 52L80 44" stroke="#82BDCE" strokeWidth="3" strokeLinecap="round" />
          <path className="mel-confetti-piece mel-confetti-piece--three" d="M162 91L156 86" stroke="#D98284" strokeWidth="3" strokeLinecap="round" />
          <path className="mel-confetti-piece mel-confetti-piece--four" d="M186 115L191 109" stroke="#D5AD62" strokeWidth="3" strokeLinecap="round" />
          <path className="mel-confetti-piece mel-confetti-piece--five" d="M81 141L76 137" stroke="#82BDCE" strokeWidth="3" strokeLinecap="round" />
          <path className="mel-confetti-piece mel-confetti-piece--six" d="M174 145L179 139" stroke="#D98284" strokeWidth="3" strokeLinecap="round" />
          <circle className="mel-confetti-piece mel-confetti-piece--seven" cx="64" cy="58" r="2.5" fill="#82BDCE" />
          <circle className="mel-confetti-piece mel-confetti-piece--eight" cx="177" cy="91" r="2.5" fill="#D98284" />
          <circle className="mel-confetti-piece mel-confetti-piece--nine" cx="58" cy="136" r="2" fill="#D5AD62" />
        </g>
      )}
    </svg>
  );
}