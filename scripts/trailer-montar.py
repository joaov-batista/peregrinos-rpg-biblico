#!/usr/bin/env python3
"""Monta o trailer das batalhas a partir dos quadros gravados por scripts/trailer-batalhas.cjs.

Gera dois vídeos com a mesma luta e a mesma trilha:
  - trailer-batalhas-16x9.mp4 (1920x1080, para computador e YouTube)
  - trailer-batalhas-9x16.mp4 (1080x1920, para reels): o jogo inteiro na largura, sem cortar a câmera,
    com fundo desfocado do próprio quadro e os letreiros acima e abaixo.
A trilha é sintetizada aqui e bate junto com o que acontece na tela (tremores, defesas perfeitas, quebrantos).

Uso: python3 scripts/trailer-montar.py <pasta dos quadros> <pasta de saída>
"""
import json, os, subprocess, sys, wave
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

QUADROS, SAIDA = sys.argv[1], sys.argv[2]
FONTES = os.path.join(os.path.dirname(__file__), 'trailer-fontes')
os.makedirs(SAIDA, exist_ok=True)
D = json.load(open(os.path.join(QUADROS, 'cenas.json')))
FPS, N, CENAS = D['fps'], D['quadros'], D['cenas']
ABRE, FECHA = int(1.8 * FPS), int(4.2 * FPS)  # cartão de abertura e logo final
TOTAL = ABRE + N + FECHA
fonte = lambda nome, t: ImageFont.truetype(os.path.join(FONTES, nome + '.ttf'), t)
OURO, OSSO = (255, 233, 168), (233, 230, 220)

# ---------------------------------------------------------------- trilha
SR = 44100
L = np.zeros(int(SR * TOTAL / FPS) + SR, dtype=np.float32)
t_de = lambda q: q / FPS
def soma(t, sinal):
  i = int(t * SR); j = min(len(L), i + len(sinal))
  if i < len(L): L[i:j] += sinal[: j - i]
def env(dur, ataque=0.005, queda=4.0):
  x = np.arange(int(dur * SR)) / SR
  return np.minimum(1, x / ataque) * np.exp(-x * queda), x
nota = lambda st: 110 * 2 ** (st / 12)
def tambor(t, vol=0.9):
  e, x = env(0.6, 0.002, 7); f = 42 + 70 * np.exp(-x * 16); fase = 2 * np.pi * np.cumsum(f) / SR
  soma(t, vol * e * np.sin(fase))
def caixa(t, vol=0.25):
  e, x = env(0.25, 0.001, 18); soma(t, vol * e * np.random.uniform(-1, 1, len(x)).astype(np.float32))
def cordas(t, sts, dur, vol=0.05):
  x = np.arange(int(dur * SR)) / SR; e = np.minimum(1, x / 0.4) * np.minimum(1, (dur - x) / 0.6)
  s = sum(np.sin(2 * np.pi * nota(st) * d * x) + 0.35 * np.sin(4 * np.pi * nota(st) * d * x) for st in sts for d in (0.996, 1.004))
  soma(t, (vol * e * s).astype(np.float32))
def baixo(t, st, dur, vol=0.22):
  e, x = env(dur, 0.01, 2.2); soma(t, vol * e * np.tanh(2.2 * np.sin(2 * np.pi * nota(st) * x)))
def sino(t, vol=0.22):  # a defesa perfeita: um brilho metálico
  e, x = env(1.2, 0.001, 5); soma(t, vol * e * (np.sin(2 * np.pi * 1318 * x) + 0.6 * np.sin(2 * np.pi * 1975 * x) + 0.3 * np.sin(2 * np.pi * 2637 * x)))
def impacto(t, forca):  # tremor da tela: estrondo grave com poeira
  tambor(t, min(1.1, 0.45 + forca * 0.05)); e, x = env(0.35, 0.002, 10); soma(t, 0.18 * e * np.random.uniform(-1, 1, len(x)).astype(np.float32))
def subida(t, dur=0.9):  # o ar que puxa antes do corte
  x = np.arange(int(dur * SR)) / SR; e = (x / dur) ** 2; soma(t - dur, (0.12 * e * np.random.uniform(-1, 1, len(x))).astype(np.float32))

BPM = 128; BATIDA = 60 / BPM
AC = [(-12, [0, 3, 7]), (-16, [-4, 0, 3]), (-9, [3, 7, 10]), (-14, [-2, 2, 5])]
fim_lutas = (ABRE + N) / FPS
cordas(0, [-12, 0, 3, 7], ABRE / FPS + 0.6, 0.04); tambor(ABRE / FPS - 0.02, 1.0)
t, k = ABRE / FPS, 0
while t < fim_lutas - 0.01:
  b, ac = AC[(k // 8) % 4]
  if k % 8 == 0: cordas(t, [b + 12] + [a + 12 for a in ac], BATIDA * 8, 0.035); baixo(t, b, BATIDA * 2)
  if k % 2 == 0: tambor(t, 0.55)
  if k % 4 == 2: caixa(t)
  baixo(t + BATIDA / 2, b + (12 if k % 2 else 0), BATIDA * 0.45, 0.12)
  t += BATIDA; k += 1
for c in CENAS:
  ini = (ABRE + c['ini']) / FPS
  subida(ini); impacto(ini, 9)
for q, tipo, v in D['eventos']:
  tt = (ABRE + q) / FPS
  if tipo == 't': impacto(tt, v)
  elif 'VIGIAI' in v: sino(tt)
  elif 'QUEBRANTADO' in v or 'ESTÁ ESCRITO' in v: impacto(tt, 12); cordas(tt, [0, 7, 12, 16], 1.4, 0.05)
  elif 'TONTO' in v: sino(tt, 0.15)
tambor(fim_lutas, 1.1); cordas(fim_lutas, [-12, 0, 7, 12, 15, 19], FECHA / FPS, 0.06); baixo(fim_lutas, -12, 3, 0.3)
# eco curto de sala, limite suave, entrada e saída
saida = L.copy()
for atraso, g in ((0.19, 0.25), (0.31, 0.16), (0.47, 0.1)):
  d = int(atraso * SR); saida[d:] += L[:-d] * g
n = int(SR * TOTAL / FPS); saida = np.tanh(saida[:n] * 1.4) * 0.85
saida *= np.minimum(1, np.minimum(np.arange(n) / (SR * 0.3), (n - np.arange(n)) / (SR * 1.6)))
wav = os.path.join(SAIDA, 'trilha.wav')
with wave.open(wav, 'wb') as w:
  w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((saida * 32767).astype('<i2').tobytes())

# ---------------------------------------------------------------- letreiros
def texto(dr, xy, s, f, cor, ancora='mm', borda=6, alfa=255):
  dr.text(xy, s, font=f, fill=(*cor, alfa), anchor=ancora, stroke_width=borda, stroke_fill=(5, 6, 11, int(alfa * 0.9)))
def cena_em(q):
  for c in CENAS:
    if c['ini'] <= q < c['fim']: return c
def opacidade(q, c, dur=1.9):  # o letreiro entra, fica e sai
  s = (q - c['ini']) / FPS
  return 0 if s > dur else min(1, s / 0.18, (dur - s) / 0.35)
def logo(img, W, H, k, vertical):
  d = ImageDraw.Draw(img, 'RGBA'); a = int(255 * k); cx = W // 2; cy = H // 2 - (40 if vertical else 30)
  texto(d, (cx, cy), 'PEREGRINOS', fonte('cinzel900', 150 if not vertical else 132), OURO, borda=8, alfa=a)
  texto(d, (cx, cy + (115 if not vertical else 110)), 'O  C A M I N H O', fonte('cinzel700', 44), OSSO, borda=4, alfa=a)
  texto(d, (cx, cy + (200 if not vertical else 230)), 'Um RPG bíblico em pixel art', fonte('alegreya800', 46), OSSO, borda=4, alfa=a)
  linhas = ['Jogue grátis no navegador,', 'no computador ou no celular'] if vertical else ['Jogue grátis no navegador, no computador ou no celular']
  for i, l in enumerate(linhas): texto(d, (cx, cy + (290 if not vertical else 330) + i * 58), l, fonte('pixelify600', 40), OURO, borda=4, alfa=a)

def quadro_jogo(q):
  return Image.open(os.path.join(QUADROS, '%05d.jpg' % q)).convert('RGB')

def ffmpeg(nome, W, H):
  return subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-shortest', '-movflags', '+faststart', os.path.join(SAIDA, nome)], stdin=subprocess.PIPE)

H16 = ffmpeg('trailer-batalhas-16x9.mp4', 1920, 1080)
V916 = ffmpeg('trailer-batalhas-9x16.mp4', 1080, 1920)
preto16, preto916 = Image.new('RGB', (1920, 1080), (5, 6, 11)), Image.new('RGB', (1080, 1920), (5, 6, 11))
ultimo = None
for i in range(TOTAL):
  q = i - ABRE
  if q < 0:  # abertura: um verso sobre o preto
    k = min(1, i / 8, (ABRE - i) / 8)
    for base, W, H, proc in ((preto16, 1920, 1080, H16), (preto916, 1080, 1920, V916)):
      img = base.copy(); d = ImageDraw.Draw(img, 'RGBA')
      texto(d, (W // 2, H // 2 - 30), 'Há gigantes no caminho.', fonte('cinzel900', 76 if W > H else 64), OSSO, alfa=int(255 * k))
      texto(d, (W // 2, H // 2 + 50), '"Sede fortes no Senhor" (Ef 6:10)', fonte('alegreya800', 40), OURO, borda=4, alfa=int(255 * k))
      proc.stdin.write(img.tobytes())
    continue
  if q >= N:  # logo final sobre o último quadro escurecido
    j = q - N; k = min(1, j / 12)
    g16 = Image.blend(ultimo, preto16, min(0.85, 0.2 + j / 20)); logo(g16, 1920, 1080, k, False); H16.stdin.write(g16.tobytes())
    g9 = Image.blend(fundo9, preto916, min(0.9, 0.3 + j / 20)); logo(g9, 1080, 1920, k, True); V916.stdin.write(g9.tobytes())
    continue
  fr = quadro_jogo(q).resize((1920, 1080), Image.LANCZOS); c = cena_em(q); op = opacidade(q, c) if c else 0
  corte = c and (q - c['ini']) < 3  # um clarão curto em cada corte
  # 16:9 — o jogo inteiro, letreiro no terço de baixo
  img = fr.copy()
  if corte: img = Image.blend(img, Image.new('RGB', img.size, (255, 250, 235)), 0.55 - (q - c['ini']) * 0.18)
  if op > 0:
    d = ImageDraw.Draw(img, 'RGBA'); a = int(255 * op)
    d.rectangle((0, 820, 1920, 1080), fill=(5, 6, 11, int(120 * op)))
    texto(d, (110, 900), c['titulo'], fonte('cinzel900', 92), OURO, 'lm', 7, a)
    texto(d, (114, 990), c['sub'], fonte('alegreya800', 46), OSSO, 'lm', 4, a)
  H16.stdin.write(img.tobytes()); ultimo = fr
  # 9:16 — o quadro inteiro na largura (nada da câmera é cortado), fundo desfocado do próprio quadro
  pequeno = fr.resize((480, 270), Image.BILINEAR)
  lado = pequeno.resize((1920 * 1920 // 1080, 1920), Image.BILINEAR).crop(((1920 * 1920 // 1080 - 1080) // 2, 0, (1920 * 1920 // 1080 - 1080) // 2 + 1080, 1920))
  fundo9 = Image.blend(lado.filter(ImageFilter.GaussianBlur(18)), preto916, 0.55)
  v = fundo9.copy(); jogo = fr.resize((1080, 608), Image.LANCZOS)
  if corte: jogo = Image.blend(jogo, Image.new('RGB', jogo.size, (255, 250, 235)), 0.55 - (q - c['ini']) * 0.18)
  y0 = (1920 - 608) // 2; v.paste(jogo, (0, y0))
  d = ImageDraw.Draw(v, 'RGBA')
  d.rectangle((0, y0 - 2, 1080, y0), fill=(255, 233, 168, 120)); d.rectangle((0, y0 + 608, 1080, y0 + 610), fill=(255, 233, 168, 120))
  texto(d, (540, 250), 'PEREGRINOS', fonte('cinzel900', 74), OURO, borda=6)
  texto(d, (540, 330), 'O  C A M I N H O', fonte('cinzel700', 30), OSSO, borda=3)
  if c:
    texto(d, (540, y0 - 110), c['titulo'], fonte('cinzel900', 84 if len(c['titulo']) < 12 else 66), OURO, borda=7)
    for i2, l in enumerate(c['sub'].split(' · ', 1)):
      texto(d, (540, y0 + 608 + 90 + i2 * 62), l, fonte('alegreya800', 50 if i2 == 0 else 44), OSSO if i2 == 0 else OURO, borda=4)
  texto(d, (540, 1740), 'Jogue grátis · navegador · computador · celular', fonte('pixelify600', 36), OURO, borda=4)
  V916.stdin.write(v.tobytes())
  if i % 150 == 0: print('quadro', i, 'de', TOTAL, flush=True)
for p in (H16, V916): p.stdin.close(); p.wait()
print('pronto', TOTAL / FPS, 's')
