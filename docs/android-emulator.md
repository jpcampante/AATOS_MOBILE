# Emulador Android no Windows

Guia para preparar uma máquina Windows e rodar o AATOS Mobile no emulador
Android com Expo Go. O app é **só Android** (ver princípio II da
[constituição](../specs/constitution.md)).

Configuração de referência (máquina atual):

| Item | Valor |
| --- | --- |
| Android Studio | `D:\Android` |
| SDK (`ANDROID_HOME`) | `D:\AndroidSdk` |
| Emuladores (`ANDROID_AVD_HOME`) | `D:\AndroidAvd` |
| Emulador | `Medium_Phone_API_37.0` (Android 17, Google Play, x86_64, 4 GB RAM) |

> Tudo fica no `D:` porque o SDK e os emuladores ocupam 15–20 GB.

## 1. Ativar o Windows Hypervisor Platform

Acelera o emulador; funciona no Windows 10/11 Home. Requisito: virtualização
ligada na BIOS.

No PowerShell **como Administrador**:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform -All
```

Reinicie o PC (mesmo que diga `RestartNeeded : False`) e confira — deve
responder `True`:

```powershell
(Get-CimInstance Win32_ComputerSystem).HypervisorPresent
```

Se continuar `False`, rode como Administrador e reinicie:

```powershell
bcdedit /set hypervisorlaunchtype auto
```

## 2. Instalar o Android Studio

1. Baixe em https://developer.android.com/studio
2. Instale no `D:` (ex.: `D:\Android`).

## 3. Assistente inicial

1. Escolha **Custom**.
2. **Android SDK Location** fora da pasta do Studio: `D:\AndroidSdk`.
   (Se o SDK ficar dentro da pasta do Studio, aparece o erro
   *"The Android SDK location is inside Studio's install location"*.)
3. Mantenha marcados Android SDK, SDK Platform e **Android Virtual Device**.
4. Aceite as licenças e aguarde o download.

Em **More Actions → SDK Manager → SDK Tools**, confirme: Build-Tools,
Android Emulator, Platform-Tools e Command-line Tools.

## 4. Variáveis de ambiente

No PowerShell (usuário normal):

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_HOME", "D:\AndroidSdk", "User")
```

```powershell
[Environment]::SetEnvironmentVariable("ANDROID_AVD_HOME", "D:\AndroidAvd", "User")
```

```powershell
New-Item -ItemType Directory -Force D:\AndroidAvd
```

```powershell
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path","User") + ";D:\AndroidSdk\platform-tools;D:\AndroidSdk\emulator", "User")
```

Feche e reabra terminais e o Android Studio.

> Se o assistente criou o emulador **antes** de `ANDROID_AVD_HOME` existir, ele
> fica em `%USERPROFILE%\.android\avd`. Mova a pasta `<nome>.avd` e o
> `<nome>.ini` para `D:\AndroidAvd` e corrija `path=` / `path.rel=` no `.ini`.

## 5. Criar ou ajustar o emulador

**Device Manager → Create Virtual Device** → um telefone (ex.: Pixel 8 ou
Medium Phone) → imagem **Google Play, x86_64**, API mais recente.
Em Advanced Settings: RAM **4096 MB**, Graphics **Hardware**.

## 6. Verificar

```powershell
adb version
```

```powershell
emulator -list-avds
```

Com o emulador ligado, deve listar `emulator-5554   device`:

```powershell
adb devices
```

## 7. Rodar o app

Ligar o emulador (ou pelo Device Manager → ▶):

```powershell
emulator -avd Medium_Phone_API_37.0
```

Na pasta do projeto — instala o Expo Go no emulador e abre o app:

```powershell
npm run android
```

No dia a dia:

- `r` no terminal do Metro recarrega o app; `a` reabre no Android.
- **Ctrl + M** no emulador abre o menu de desenvolvedor.
- Mudanças no código aparecem na hora (Fast Refresh).

## Problemas comuns

| Sintoma | Causa provável | Solução |
| --- | --- | --- |
| `adb` / `emulator` não reconhecidos | PATH não recarregado | Abrir um terminal novo |
| `emulator -list-avds` vazio | Emulador fora de `ANDROID_AVD_HOME` | Mover para `D:\AndroidAvd` (passo 4) |
| Emulador muito lento | Hypervisor desligado | Passo 1 |
| `npm run android` não acha o dispositivo | Emulador não terminou de iniciar | Esperar a tela inicial e rodar `adb devices` |

## Quando precisar de build nativo

Expo Go não precisa de Java. Para *development builds*
(`npx expo run:android`), instale o JDK 17:

```powershell
winget install Microsoft.OpenJDK.17
```
