# SSH - Unreal Servers

Record de acceso SSH para servidores de Unreal (no incluir credenciales privadas en este repo).

- Host principal: `jota@217.154.124.154`

## Comandos rápidos

- SSH directo:
  - `ssh jota@217.154.124.154`

- Descargar desde el servidor (ejemplo):
  - `scp -r jota@217.154.124.154:/ruta/remota /ruta/local`

- Subir al servidor (ejemplo):
  - `scp -r /ruta/local jota@217.154.124.154:/ruta/remota`

## (Opcional) Alias en ~/.ssh/config (Windows)

Edita `C:\\Users\\%USERNAME%\\.ssh\\config` y añade:

```
Host unreal-prod
  HostName 217.154.124.154
  User jota
  IdentityFile C:\\Users\\%USERNAME%\\.ssh\\id_rsa
  ServerAliveInterval 60
  ServerAliveCountMax 5
```

Uso:
- `ssh unreal-prod`

## Notas
- No subas claves privadas ni contraseñas al repositorio.
- Si usas otra identidad (clave), ajusta `IdentityFile` en el alias.