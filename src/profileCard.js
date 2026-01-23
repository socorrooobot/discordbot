import sharp from 'sharp';
import https from 'https';
import { createWriteStream, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

async function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const tmpFile = join(tmpdir(), `avatar_${Date.now()}.png`);
    const file = createWriteStream(tmpFile);

    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(tmpFile);
      });
    }).on('error', reject);
  });
}

export async function generateProfileCard(userInfo) {
  try {
    const { username, avatarURL, level, xp, xpNeeded, balance, isVip, vipColor } = userInfo;
    const vipBadge = isVip ? '👑 VIP' : ''; // Adiciona badge VIP se o usuário for VIP

    // Download avatar
    let avatarBuffer;
    try {
      const avatarPath = await downloadImage(avatarURL);
      const avatar = await sharp(avatarPath).resize(150, 150).png().toBuffer();
      unlinkSync(avatarPath);
      avatarBuffer = avatar;
    } catch (e) {
      console.error('Avatar download error:', e);
      avatarBuffer = null;
    }

    // Calcular barra de XP
    const xpPercent = (xp / xpNeeded) * 100;
    const barWidth = 200;
    const filledWidth = Math.round((xpPercent / 100) * barWidth);

    // Criar SVG do card
    const svg = `
      <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg">
        <!-- Fundo escuro com gradiente -->
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${vipColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a0a1a;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#ff69b4;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0a0a0a;stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Fundo -->
        <rect width="500" height="300" fill="url(#grad)"/>
        <rect width="500" height="300" fill="#0a0a0a" opacity="0.3"/>

        <!-- Borda -->
        <rect x="10" y="10" width="480" height="280" fill="none" stroke="${vipColor}" stroke-width="2"/>

        <!-- Círculo do avatar (placeholder) -->
        <circle cx="100" cy="100" r="75" fill="#1a1a1a" stroke="${vipColor}" stroke-width="2"/>
        <text x="100" y="110" text-anchor="middle" font-size="14" fill="${vipColor}" font-family="Arial">Avatar</text>

        <!-- Nome do usuário -->
        <text x="200" y="50" font-size="28" font-weight="bold" fill="#ffffff" font-family="Arial">${vipBadge}${username}</text>

        <!-- Nível -->
        <text x="200" y="90" font-size="18" fill="${vipColor}" font-family="Arial">⭐ Nível: ${level}</text>

        <!-- XP -->
        <text x="200" y="130" font-size="16" fill="#ffffff" font-family="Arial">✨ XP: ${xp}/${xpNeeded}</text>

        <!-- Barra de XP -->
        <rect x="200" y="145" width="${barWidth}" height="15" fill="#2a2a2a" stroke="${vipColor}" stroke-width="1"/>
        <rect x="200" y="145" width="${filledWidth}" height="15" fill="url(#xpGrad)"/>

        <!-- Saldo -->
        <text x="200" y="200" font-size="16" fill="#ffd700" font-family="Arial">💰 Saldo: ${balance} Akita Neru</text>

        <!-- Rodapé -->
        <text x="250" y="280" text-anchor="middle" font-size="12" fill="${vipColor}" font-family="Arial" opacity="0.8">*A melodia se perde no ruído.* 🌑</text>
      </svg>
    `;

    // Converter SVG para buffer
    const svgBuffer = Buffer.from(svg);

    // Converter SVG para PNG
    let finalImage = await sharp(svgBuffer)
      .png()
      .toBuffer();

    // Se temos o avatar, sobrepor ele no card
    if (avatarBuffer) {
      try {
        finalImage = await sharp(finalImage)
          .composite([
            {
              input: avatarBuffer,
              left: 28,
              top: 25,
              blend: 'over'
            }
          ])
          .png()
          .toBuffer();
      } catch (e) {
        console.error('Avatar composite error:', e);
      }
    }

    return finalImage;
  } catch (error) {
    console.error('Profile card generation error:', error);
    return null;
  }
}