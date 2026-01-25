# MoiBook2025 Portable (Offline-friendly)

இந்த folder-ல் build செய்யப்பட்ட UI + ஓட்டுவதற்கான launcher மட்டுமே உள்ளது. VS Code தேவையில்லை; ஒரு கிளிக்கில் திறக்கும்.

## இயக்குவது (டபுள்-கிளிக் முறை)
1) Python 3 நிறுவியிருக்க வேண்டும் (`python --version` மூலம் உறுதி செய்யவும்).
2) `START_MOIBOOK_APP.bat`-ஐ இரட்டை கிளிக் செய்க.
3) சில வினாடிகளில் உலாவி `http://localhost:3000/` திறக்கும். Server window பெயர் `MOIBOOK_STATIC`; அதை மூடினால் ஆப் நிற்கும்.

## மற்ற சாதனங்களில் (Wi‑Fi இல்லாமலும்)
- லாப்டாப் ஹாட்ஸ்பாட் / USB tethering / LAN cable பயன்படுத்தலாம். வெளி இணையம் தேவையில்லை.
- கிளையன்ட் சாதன உலாவியில் `http://<laptop-ip>:3000/` திறக்கவும் (`ipconfig` → IPv4 Address).

## சேர்க்கப்பட்டவை
- `build/` : சமீபத்திய React production build (responsive UI + அச்சு மேம்பாடுகள் உள்ளிட்டவை).
- `START_MOIBOOK_APP.bat` : Python HTTP server (port 3000) + auto browser open.

## புதுப்பிக்க வேண்டுமெனில்
1) மூல project root-லில் `npm run build` ஓட்டவும்.
2) உருவான `build/`-ஐ இங்கே `MoiBook2025_Portable/build/`-க்கு copy/robocopy செய்யவும்.
3) தேவையெனில் bat file-ல் port மாற்றிக் கொள்ளலாம் (`PORT` env var inside the file; default 3000).

## தெரிந்த தேவைகள்
- Windows 10+
- Python 3.7+
- 500 MB இடம்
- Firewall prompt வந்தால் **Private network**க்கு Allow செய்யவும்.
