// trilha do trailer, sintetizada: piano esparso e cordas no começo, ostinato e tambor nas lutas, acorde final no título
const fs = require('fs'), SR = 44100, DUR = 65.6, N = Math.floor(SR * DUR), L = new Float32Array(N);
const nota = st => 220 * Math.pow(2, st / 12);
const piano = (t, st, vol, dur = 3) => { const f = nota(st), i0 = Math.floor(t * SR); for (let i = 0; i < dur * SR && i0 + i < N; i++) { const x = i / SR, env = Math.min(1, x * 90) * Math.exp(-x * 1.7); L[i0 + i] += vol * env * (Math.sin(2 * Math.PI * f * x) + 0.3 * Math.sin(4 * Math.PI * f * x) + 0.08 * Math.sin(6 * Math.PI * f * x)); } };
const cordas = (t, sts, dur, vol) => { const i0 = Math.floor(t * SR); for (const st of sts) for (const d of [0.997, 1.003]) { const f = nota(st) * d; for (let i = 0; i < dur * SR && i0 + i < N; i++) { const x = i / SR, k = x / dur, env = Math.min(1, k * 3) * Math.min(1, (1 - k) * 3); let s = 0; for (let h = 1; h <= 5; h++) s += Math.sin(2 * Math.PI * f * h * x) / (h * h); L[i0 + i] += vol * env * s; } } };
const tambor = (t, vol) => { const i0 = Math.floor(t * SR); for (let i = 0; i < 0.5 * SR && i0 + i < N; i++) { const x = i / SR, f = 38 + 60 * Math.exp(-x * 14); L[i0 + i] += vol * Math.exp(-x * 9) * Math.sin(2 * Math.PI * f * x); } };
const AC = [[-12, [0, 3, 7], [12, 15, 19, 22]], [-16, [-4, 0, 3], [8, 12, 15, 20]], [-9, [3, 7, 10], [10, 15, 19, 22]], [-14, [-2, 2, 5], [10, 14, 17, 19]]];
let t = 0, n = 0;
for (; t < 23; t += 4.6, n++) { const [b, a, m] = AC[n % 4]; cordas(t, [b, ...a], 5.6, 0.035); piano(t, b, 0.22, 4); [0, 2, 1, 2, 0, 1].forEach((k, i) => piano(t + i * 4.6 / 6, a[k % a.length] + 12, 0.11, 2.6)); piano(t + 1.2, m[n % m.length], 0.2, 3.4); if (n % 2) piano(t + 2.9, m[(n + 1) % m.length], 0.16, 3.2); }
for (; t < 59; t += 2.6, n++) { const [b, a, m] = AC[n % 4]; cordas(t, [b, ...a], 3.2, 0.05); for (let i = 0; i < 8; i++) { piano(t + i * 2.6 / 8, b + (i % 2 ? 12 : 0), 0.15, 0.5); if (i % 4 === 0) tambor(t + i * 2.6 / 8, 0.5); if (i === 6) tambor(t + i * 2.6 / 8 + 2.6 / 16, 0.3); } for (let i = 0; i < 4; i++) piano(t + i * 2.6 / 4 + 2.6 / 8, m[(i + n) % m.length] + (n % 3 === 2 ? 12 : 0), 0.17, 1.4); }
tambor(59.4, 0.8); cordas(59.4, [-12, 0, 7, 12, 15], 6, 0.06); piano(59.4, -12, 0.3, 6); piano(59.4, 12, 0.2, 6); piano(60.2, 19, 0.16, 5); piano(61, 24, 0.14, 5);
// eco de sala e limite suave
const out = new Float32Array(N); for (let i = 0; i < N; i++) { out[i] = L[i]; for (const [d, g] of [[0.31, 0.3], [0.47, 0.22], [0.73, 0.16]]) { const j = i - Math.floor(d * SR); if (j >= 0) out[i] += out[j] * g; } }
const buf = Buffer.alloc(44 + N * 2); buf.write('RIFF', 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) { const fade = Math.min(1, i / (SR * 1.5), (N - i) / (SR * 2)); buf.writeInt16LE(Math.round(Math.tanh(out[i] * 1.6) * 0.8 * fade * 32767), 44 + i * 2); }
fs.writeFileSync(__dirname + '/trilha.wav', buf);
