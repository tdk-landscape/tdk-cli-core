# WSL2

TDK supports Ubuntu on WSL2. Native Windows is not supported.

## Install
1. Install Docker Desktop and enable WSL2 integration for your distro.
2. In Ubuntu: install Tilt.
3. In Ubuntu:

curl -fsSL https://tdk-landscape.github.io/install.sh | sh
tdk doctor
tdk project example
cd tdk-example
tdk up

Open the URL printed by tdk networks from Windows browser. *.localhost should work on recent Windows.

Common failures
Docker not visible in WSL: enable the distro in Docker Desktop → Resources → WSL integration.
Port 80 taken by Windows IIS: stop IIS or skip host bind docs if TDK uses Traefik on 80.
