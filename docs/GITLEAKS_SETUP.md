# 🔐 Configuración de Seguridad con Gitleaks

## ¿Qué es Gitleaks?

**Gitleaks** es una herramienta que detecta secretos (contraseñas, API keys, tokens) en el código antes de que lleguen a GitHub.

## ✅ Qué hemos configurado

### 1. **Pre-commit Hook** (`.githooks/pre-commit`)
- Se ejecuta **antes de cada commit**
- Escanea los archivos que estás a punto de commitear
- **Bloquea el commit** si detecta secretos
- Previene que expongas credenciales

### 2. **Pre-push Hook** (`.githooks/pre-push`)
- Se ejecuta **antes de hacer push a GitHub**
- Verifica todo el historial que vas a subir
- Doble protección por si algo se escapó

### 3. **Configuración de Gitleaks** (`.gitleaks.toml`)
Detecta:
- ✅ AWS Access Keys
- ✅ AWS Secret Keys
- ✅ GitHub Tokens
- ✅ PostgreSQL Passwords
- ✅ Database Connection Strings
- ✅ Private Keys (RSA, SSH, PGP)
- ✅ API Keys
- ✅ JWT Tokens

### 4. **Archivo de Ignorar** (`.gitleaksignore`)
Excluye falsos positivos como:
- Documentos de ejemplo (SECURITY_RECOVERY_PLAN.md)
- Archivos .env.example
- Directorios de build/logs

---

## 📋 Instalación para tu equipo

**Windows:**
```powershell
choco install gitleaks
```

**macOS:**
```bash
brew install gitleaks
```

**Linux:**
```bash
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.2/gitleaks-linux-x64
chmod +x gitleaks-linux-x64
sudo mv gitleaks-linux-x64 /usr/local/bin/gitleaks
```

**O descarga directamente:**
https://github.com/gitleaks/gitleaks/releases

---

## 🚀 Uso

### Hacer un commit normal:
```bash
git add .
git commit -m "tu mensaje"
```

Si hay secretos:
```
❌ ALERTA: Se detectaron posibles secretos en tu commit
```

### Si necesitas forzar (NO RECOMENDADO):
```bash
git commit --no-verify
```

### Escanear todo el repositorio manualmente:
```bash
gitleaks detect --source git --verbose
```

### Escanear solo los cambios staged:
```bash
gitleaks protect --staged --verbose
```

---

## 🛡️ Mejores prácticas

1. **NUNCA** hardcodees credenciales en archivos `.js`, `.ts`, `.env` commiteados
2. **SIEMPRE** usa variables de entorno:
   ```javascript
   const password = process.env.PGPASSWORD;
   ```
3. **VERIFICA** que `.env` está en `.gitignore`
4. **REVISA** antes de hacer commit:
   ```bash
   git diff --cached
   ```

---

## 📚 Archivos de configuración

| Archivo | Propósito |
|---------|-----------|
| `.gitleaks.toml` | Configuración de patrones a detectar |
| `.gitleaksignore` | Archivos/patrones a ignorar |
| `.githooks/pre-commit` | Script que se ejecuta antes del commit |
| `.githooks/pre-push` | Script que se ejecuta antes del push |

---

## ⚠️ Si cometes un error

1. **Detectas que hay un secreto expuesto:**
   ```bash
   git reset --soft HEAD~1  # Deshace el commit pero mantiene cambios
   # Elimina el secreto
   git add .
   git commit -m "fix: remove secret"
   ```

2. **Si ya hizo push a GitHub:**
   ```bash
   # Cambiar la contraseña/key en el servicio
   # Eliminar del historial usando git filter-branch
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch archivo_con_secret.js" \
     --prune-empty --tag-name-filter cat -- --all
   git push --force
   ```

---

## ✅ Checklist de Seguridad

- [ ] Gitleaks instalado en tu máquina
- [ ] `.githooks` commiteado en el repo
- [ ] Todos en el equipo clonan/actualizan el repo
- [ ] Cada miembro ejecuta: `git config core.hooksPath .githooks`
- [ ] Prueba haciendo commit con una "contraseña falsa" para ver que bloquea

---

## 📞 Más información

- **Gitleaks GitHub:** https://github.com/gitleaks/gitleaks
- **Documentación:** https://github.com/gitleaks/gitleaks?tab=readme-ov-file

---

**Fecha:** 25/12/2025  
**Estado:** Configuración completada y funcional
