import { setupEgg } from '../core/egg.js';

const egg = setupEgg('console');

const LOGO = [
  '      ▄▀▀▄  █▄ ▄█  █▀▀▄  █▀▀▄  █▀▀▀  ▄▀▀▀',
  ' ██   █  █  █ ▀ █  █▀▀▄  █▄▄▀  █▀▀    ▀▀▄',
  '      ▀▄▄▀  ▀   ▀  ▀▀▀   ▀  ▀  ▀▀▀▀  ▀▀▀ ',
].join('\n');

const BASE = 'background:#0a0a0a;color:#ece8e1;padding:6px 12px;';
const STYLE = {
  logo: `${BASE}font:12px/1.15 ui-monospace,Menlo,monospace;`,
  verse: `${BASE}font:italic 16px Georgia,serif;`,
  code: `${BASE}font:13px ui-monospace,Menlo,monospace;color:#b9b2a6;`,
  whisper: `${BASE}font:italic 13px Georgia,serif;color:#b9b2a6;`,
};

function say(text, style = STYLE.whisper) {
  console.log(`%c${text}`, style);
}

say(LOGO, STYLE.logo);
say('Toute ombre naît d’une…', STYLE.verse);
say("atlas.lift('…')", STYLE.code);

const atlas = Object.freeze({
  lift(answer) {
    egg.start({ input: 'console' });
    if (typeof answer !== 'string' || !answer.trim()) {
      say('Un mot, entre guillemets.');
      return undefined;
    }
    say('Le monde écoute…');
    egg.submit({ answer: answer.trim() }).then((result) => {
      if (result.ok) say('L’ombre se retire. Regarde la page.', STYLE.verse);
      else if (result.kind === 'rejected') say(result.hint ?? 'Rien ne bouge.');
      else if (result.kind === 'rate_limited') say('Le monde se repose. Reviens plus tard.');
      else if (result.kind !== 'busy') say('Le monde ne répond pas. Réessaie dans un instant.');
    });
    return undefined;
  },
});

Object.defineProperty(window, 'atlas', { value: atlas, configurable: true });
