# Use TDK with WSL2

The supported Windows development path is Ubuntu on WSL2 with Docker Desktop's WSL integration.
TDK's CLI runs as a Linux program inside the distribution, and Docker Desktop provides the Linux
container engine.

## Setup

1. Install WSL2 and an Ubuntu distribution from Windows.
2. Install Docker Desktop for Windows and enable **Use the WSL 2 based engine**.
3. In Docker Desktop, open **Settings → Resources → WSL Integration** and enable the Ubuntu
   distribution you use.
4. Open Ubuntu and verify `docker version` and `docker compose version` work there.
5. Install Node.js 22.12+, Bun, and Tilt inside Ubuntu. Do not use Windows-installed binaries from
   the Linux shell.
6. Clone the project into the Linux filesystem (for example, `~/src`) rather than `/mnt/c`, then
   run `tdk doctor` followed by `tdk project --yes` or `tdk up`.

TDK requires Linux containers and ports 80, 443, and 5432 to be available. Docker Desktop's WSL
integration exposes the daemon to Ubuntu; the Windows CLI is not needed for normal project work.

If Docker is unavailable in Ubuntu, confirm the distribution is enabled in Docker Desktop's WSL
Integration settings, restart Docker Desktop, then run `wsl --shutdown` in PowerShell and reopen
Ubuntu.
