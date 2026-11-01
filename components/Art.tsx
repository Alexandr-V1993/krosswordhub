import { useId, type ReactNode } from "react";

// Собственные иллюстрации сайта: одна картинка на тему + кубок победы.
// Нарисованы векторно (SVG), поэтому чёткие на любом экране и ничего не загружают из сети.

type ArtProps = { size?: number; className?: string };

function Frame({ size = 64, className, label, bg, children }: ArtProps & { label: string; bg: string; children: ReactNode }) {
  const clip = "art" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={label} focusable="false">
      <defs><clipPath id={clip}><circle cx="60" cy="60" r="56" /></clipPath></defs>
      <circle cx="60" cy="60" r="56" fill={bg} />
      <g clipPath={`url(#${clip})`}>{children}</g>
    </svg>
  );
}

function Nature(p: ArtProps) {
  return <Frame {...p} label="Природа" bg="#e3eedf">
    <circle cx="88" cy="32" r="11" fill="#f2c987" />
    <circle cx="88" cy="32" r="16" fill="#f2c987" opacity=".25" />
    <ellipse cx="34" cy="30" rx="14" ry="5" fill="#fff" opacity=".85" />
    <ellipse cx="44" cy="26" rx="9" ry="5" fill="#fff" opacity=".85" />
    <path d="M0 84 Q30 58 62 80 T124 70 V124 H0Z" fill="#bcd4b4" />
    <path d="M0 98 Q38 78 74 94 T124 88 V124 H0Z" fill="#8fb58d" />
    <rect x="57" y="82" width="7" height="18" rx="2" fill="#8a6a4b" />
    <path d="M60.5 22 L80 54 H41Z" fill="#416b50" />
    <path d="M60.5 38 L84 72 H37Z" fill="#4f7d5d" />
    <path d="M60.5 52 L88 88 H33Z" fill="#63876a" />
    <circle cx="26" cy="96" r="3" fill="#f3dfc9" /><circle cx="96" cy="100" r="3" fill="#e8b0a0" />
  </Frame>;
}

function Travel(p: ArtProps) {
  return <Frame {...p} label="География" bg="#e9e6f3">
    <circle cx="58" cy="64" r="33" fill="#cfe0ec" stroke="#5b7f9a" strokeWidth="3" />
    <path d="M40 50 q8-10 18-4 q6 8-4 13 q-8 4-12 12 q-8-8-2-21Z" fill="#8fb58d" />
    <path d="M66 64 q12-6 17 4 q0 12-12 14 q-8-6-5-18Z" fill="#8fb58d" />
    <ellipse cx="58" cy="64" rx="14" ry="33" fill="none" stroke="#5b7f9a" strokeWidth="2" opacity=".55" />
    <path d="M25 64 H91 M30 48 Q58 56 86 48 M30 80 Q58 72 86 80" fill="none" stroke="#5b7f9a" strokeWidth="2" opacity=".55" />
    <path d="M40 102 H76" stroke="#766a92" strokeWidth="4" strokeLinecap="round" />
    <path d="M58 97 V102" stroke="#766a92" strokeWidth="4" />
    <path d="M90 56 C80 44 76 38 76 31 a14 14 0 0 1 28 0 C104 38 100 44 90 56Z" fill="#d18d55" />
    <circle cx="90" cy="31" r="5.5" fill="#fffdf8" />
  </Frame>;
}

function Culture(p: ArtProps) {
  return <Frame {...p} label="Культура" bg="#e6eee3">
    <path d="M14 52 Q38 42 60 54 V98 Q38 88 14 98Z" fill="#fffdf8" stroke="#416b50" strokeWidth="3" strokeLinejoin="round" />
    <path d="M106 52 Q82 42 60 54 V98 Q82 88 106 98Z" fill="#f6f1e4" stroke="#416b50" strokeWidth="3" strokeLinejoin="round" />
    <path d="M24 62 Q38 58 50 64 M24 72 Q38 68 50 74 M24 82 Q38 78 50 84" fill="none" stroke="#b9c9b5" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M70 64 Q82 58 96 62 M70 74 Q82 68 96 72 M70 84 Q82 78 96 82" fill="none" stroke="#c9c3a8" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="46" cy="36" rx="7" ry="5" fill="#766a92" transform="rotate(-20 46 36)" />
    <ellipse cx="74" cy="30" rx="7" ry="5" fill="#766a92" transform="rotate(-20 74 30)" />
    <path d="M52 34 V14 L80 8 V28" fill="none" stroke="#766a92" strokeWidth="3" strokeLinejoin="round" />
    <path d="M52 18 L80 12" stroke="#766a92" strokeWidth="5" strokeLinecap="round" />
    <path d="M100 26 l2.2 5 5 2.2 -5 2.2 -2.2 5 -2.2-5 -5-2.2 5-2.2z" fill="#d18d55" />
  </Frame>;
}

function Food(p: ArtProps) {
  return <Frame {...p} label="Еда" bg="#f6f0dc">
    <ellipse cx="60" cy="100" rx="30" ry="6" fill="#000" opacity=".08" />
    <path d="M60 40 C46 28 24 38 28 64 C31 86 48 102 60 95 C72 102 89 86 92 64 C96 38 74 28 60 40Z" fill="#d9694f" />
    <path d="M60 40 C74 28 96 38 92 64 C89 86 72 102 60 95Z" fill="#c4543e" opacity=".55" />
    <ellipse cx="42" cy="56" rx="6" ry="11" fill="#fff" opacity=".35" transform="rotate(20 42 56)" />
    <path d="M60 40 Q59 28 66 20" stroke="#7a5a3c" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <path d="M64 32 Q76 20 90 26 Q82 40 64 32Z" fill="#63876a" />
    <path d="M64 32 Q76 28 86 27" stroke="#416b50" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </Frame>;
}

function Science(p: ArtProps) {
  return <Frame {...p} label="Наука" bg="#e9e6f3">
    {[0, 60, 120].map(a => (
      <g key={a} transform={`rotate(${a} 60 60)`}>
        <ellipse cx="60" cy="60" rx="42" ry="15" fill="none" stroke="#766a92" strokeWidth="3" />
        <circle cx="102" cy="60" r="5.5" fill="#416b50" />
      </g>
    ))}
    <circle cx="60" cy="60" r="13" fill="#d18d55" />
    <circle cx="56" cy="56" r="4" fill="#fff" opacity=".45" />
  </Frame>;
}

function Everyday(p: ArtProps) {
  return <Frame {...p} label="На каждый день" bg="#f6ece0">
    <ellipse cx="58" cy="98" rx="34" ry="7" fill="#d9c3a5" />
    <path d="M30 50 H86 V68 C86 84 74 96 58 96 C42 96 30 84 30 68Z" fill="#fffdf8" stroke="#416b50" strokeWidth="3.5" strokeLinejoin="round" />
    <path d="M86 56 H94 a10 10 0 0 1 0 20 H84" fill="none" stroke="#416b50" strokeWidth="3.5" strokeLinecap="round" />
    <ellipse cx="58" cy="50" rx="28" ry="5.5" fill="#8a6a4b" />
    <path d="M46 38 q-6-8 0-14 q6-6 0-12 M60 38 q-6-8 0-14 q6-6 0-12 M74 38 q-6-8 0-14 q6-6 0-12" fill="none" stroke="#b8a58c" strokeWidth="3" strokeLinecap="round" />
    <path d="M40 62 q0 14 10 20" fill="none" stroke="#e8e0d0" strokeWidth="3" strokeLinecap="round" />
  </Frame>;
}

function Sport(p: ArtProps) {
  const ball = "ball" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return <Frame {...p} label="Спорт" bg="#e3eedf">
    <defs><clipPath id={ball}><circle cx="60" cy="60" r="34" /></clipPath></defs>
    <path d="M0 96 Q60 86 124 96 V124 H0Z" fill="#8fb58d" />
    <ellipse cx="62" cy="99" rx="30" ry="5" fill="#000" opacity=".13" />
    <circle cx="60" cy="60" r="34" fill="#fffdf8" />
    <g clipPath={`url(#${ball})`} fill="#2f3a2f">
      <polygon points="60,49 70.5,56.6 66.5,69 53.5,69 49.5,56.6" />
      <polygon points="60,18 72,28 66,36 54,36 48,28" />
      <polygon points="96,46 100,60 92,70 82,64 82,50" />
      <polygon points="24,46 20,60 28,70 38,64 38,50" />
      <polygon points="44,100 52,86 68,86 76,100" />
    </g>
    <path d="M60 49 V36 M70.5 56.6 L82 50 M66.5 69 L75 82 M53.5 69 L45 82 M49.5 56.6 L38 50" stroke="#2f3a2f" strokeWidth="3" strokeLinecap="round" />
    <circle cx="60" cy="60" r="34" fill="none" stroke="#2f3a2f" strokeWidth="3" />
    <path d="M14 42 q-2-8 4-14 M9 56 q-3-6 0-12" fill="none" stroke="#f2c987" strokeWidth="3.5" strokeLinecap="round" />
  </Frame>;
}

function All(p: ArtProps) {
  return <Frame {...p} label="Всё вперемешку" bg="#f6f0dc">
    <rect x="22" y="48" width="38" height="38" rx="9" fill="#e6e1f0" stroke="#766a92" strokeWidth="3" transform="rotate(14 41 67)" />
    <g transform="rotate(14 41 67)" fill="#766a92"><circle cx="33" cy="59" r="3.2" /><circle cx="49" cy="75" r="3.2" /></g>
    <rect x="46" y="26" width="52" height="52" rx="12" fill="#fffdf8" stroke="#416b50" strokeWidth="3.5" transform="rotate(-10 72 52)" />
    <g transform="rotate(-10 72 52)" fill="#416b50">
      <circle cx="58" cy="38" r="4.4" /><circle cx="86" cy="38" r="4.4" /><circle cx="72" cy="52" r="4.4" /><circle cx="58" cy="66" r="4.4" /><circle cx="86" cy="66" r="4.4" />
    </g>
    <path d="M92 92 l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4-5.6 -5.6-2.4 5.6-2.4z" fill="#d18d55" />
  </Frame>;
}

export function TrophyArt({ size = 96, className }: ArtProps) {
  const clip = "tr" + useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 120 120" role="img" aria-label="Кубок" focusable="false">
      <defs><clipPath id={clip}><circle cx="60" cy="60" r="56" /></clipPath></defs>
      <circle cx="60" cy="60" r="56" fill="#f6ecd2" />
      <g clipPath={`url(#${clip})`}>
        <path d="M60 4 L66 52 L60 60 L54 52Z" fill="#fff" opacity=".35" transform="rotate(-40 60 60)" />
        <path d="M60 4 L66 52 L60 60 L54 52Z" fill="#fff" opacity=".35" transform="rotate(40 60 60)" />
      </g>
      <path d="M38 36 H27 C27 54 34 60 43 62" fill="none" stroke="#e0a93f" strokeWidth="6" strokeLinecap="round" />
      <path d="M82 36 H93 C93 54 86 60 77 62" fill="none" stroke="#e0a93f" strokeWidth="6" strokeLinecap="round" />
      <path d="M38 26 H82 V50 C82 66 71 76 60 76 C49 76 38 66 38 50Z" fill="#f1c25e" />
      <path d="M60 26 H82 V50 C82 66 71 76 60 76Z" fill="#e0a93f" opacity=".55" />
      <path d="M60 36 l4.2 8.6 9.4 1.4 -6.8 6.6 1.6 9.4 -8.4-4.4 -8.4 4.4 1.6-9.4 -6.8-6.6 9.4-1.4z" fill="#fffdf8" />
      <rect x="54.5" y="76" width="11" height="12" fill="#e0a93f" />
      <rect x="42" y="88" width="36" height="9" rx="3.5" fill="#b47c46" />
      <rect x="47" y="97" width="26" height="5" rx="2" fill="#8a5d31" />
    </svg>
  );
}

const MAP: Record<string, (p: ArtProps) => ReactNode> = {
  all: All, nature: Nature, travel: Travel, culture: Culture, food: Food, science: Science, everyday: Everyday, sport: Sport,
};

/** Картинка темы по её id */
export function CategoryArt({ id, size = 64, className }: { id: string } & ArtProps) {
  const Comp = MAP[id] ?? All;
  return <Comp size={size} className={className} />;
}
