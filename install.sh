#!/bin/bash
# TDK CLI Install Script
# Install the Tilt Development Kit CLI
# Usage: curl -fsSL https://raw.githubusercontent.com/tdk-landscape/tdk-cli/main/install.sh | bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/tdk-landscape/tdk-cli.git"
INSTALL_DIR="${HOME}/.tdk"
BIN_DIR="${HOME}/.bun/bin"

# Print functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        CYGWIN*)    echo "windows";;
        MINGW*)     echo "windows";;
        MSYS*)      echo "windows";;
        *)          echo "unknown";;
    esac
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    OS=$(detect_os)
    print_info "Detected OS: $OS"
    
    # Check for git
    if ! command_exists git; then
        print_error "git is required but not installed."
        echo "Please install git first:"
        echo "  macOS: brew install git"
        echo "  Linux: sudo apt-get install git (or your package manager)"
        exit 1
    fi
    
    # Check for a JavaScript runtime (bun or node)
    if command_exists bun; then
        RUNTIME="bun"
        print_success "Found bun runtime"
    elif command_exists node; then
        RUNTIME="node"
        print_success "Found node runtime"
        
        # Check for npm
        if ! command_exists npm; then
            print_error "npm is required with node but not found"
            exit 1
        fi
    else
        print_warning "No JavaScript runtime found (bun or node)"
        echo ""
        echo "Would you like to install Bun? (Recommended - much faster)"
        echo "  curl -fsSL https://bun.sh/install | bash"
        echo ""
        read -p "Install Bun now? [Y/n] " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            print_info "Installing Bun..."
            curl -fsSL https://bun.sh/install | bash
            
            # Source bun setup
            if [ -f "${HOME}/.bashrc" ]; then
                export BUN_INSTALL="${HOME}/.bun"
                export PATH="${BUN_INSTALL}/bin:$PATH"
            fi
            
            if command_exists bun; then
                RUNTIME="bun"
                print_success "Bun installed successfully"
            else
                print_error "Bun installation failed or not in PATH"
                print_info "Please restart your terminal and run this script again"
                exit 1
            fi
        else
            print_error "Bun or Node.js is required to install TDK"
            exit 1
        fi
    fi
}

# Setup directories
setup_directories() {
    print_info "Setting up directories..."
    
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$BIN_DIR"
    
    print_success "Directories created"
}

# Clone or update repository
clone_repository() {
    print_info "Cloning TDK CLI repository..."
    
    if [ -d "${INSTALL_DIR}/tdk-cli" ]; then
        print_warning "Existing installation found, updating..."
        cd "${INSTALL_DIR}/tdk-cli"
        git fetch origin
        git reset --hard origin/main
    else
        git clone --depth 1 "$REPO_URL" "${INSTALL_DIR}/tdk-cli"
        cd "${INSTALL_DIR}/tdk-cli"
    fi
    
    print_success "Repository cloned/updated"
}

# Install dependencies and link
install_and_link() {
    print_info "Installing dependencies..."
    
    cd "${INSTALL_DIR}/tdk-cli/cli"
    
    if [ "$RUNTIME" = "bun" ]; then
        bun install
        print_success "Dependencies installed with bun"
        
        print_info "Linking TDK CLI..."
        bun link --force
        print_success "TDK CLI linked globally"
    else
        npm install
        print_success "Dependencies installed with npm"
        
        print_info "Linking TDK CLI..."
        npm link --force
        print_success "TDK CLI linked globally"
    fi
}

# Setup PATH
setup_path() {
    print_info "Setting up PATH..."
    
    SHELL_CONFIG=""
    if [ -f "${HOME}/.zshrc" ]; then
        SHELL_CONFIG="${HOME}/.zshrc"
    elif [ -f "${HOME}/.bashrc" ]; then
        SHELL_CONFIG="${HOME}/.bashrc"
    elif [ -f "${HOME}/.bash_profile" ]; then
        SHELL_CONFIG="${HOME}/.bash_profile"
    fi
    
    if [ -n "$SHELL_CONFIG" ]; then
        if ! grep -q "\.bun/bin" "$SHELL_CONFIG" 2>/dev/null; then
            echo "" >> "$SHELL_CONFIG"
            echo "# TDK CLI (installed via install.sh)" >> "$SHELL_CONFIG"
            echo 'export PATH="${HOME}/.bun/bin:${PATH}"' >> "$SHELL_CONFIG"
            print_success "Added ~/.bun/bin to PATH in $(basename "$SHELL_CONFIG")"
            print_warning "Please restart your terminal or run: source $SHELL_CONFIG"
        else
            print_info "PATH already configured in $(basename "$SHELL_CONFIG")"
        fi
    else
        print_warning "Could not detect shell config file"
        print_info "Please manually add to your shell config:"
        echo 'export PATH="${HOME}/.bun/bin:${PATH}"'
    fi
}

# Verify installation
verify_installation() {
    print_info "Verifying installation..."
    
    export PATH="${BIN_DIR}:${PATH}"
    
    if command_exists tdk; then
        VERSION=$(tdk -v 2>/dev/null || echo "unknown")
        print_success "TDK CLI installed successfully!"
        echo ""
        echo "Version: $VERSION"
        echo "Location: $(which tdk)"
        echo ""
        echo "Quick start:"
        echo "  tdk --help       # Show all commands"
        echo "  tdk project      # Initialize a new project"
        echo "  tdk resource api # Create a new resource"
        echo ""
        print_info "Happy coding! 🚀"
    else
        print_error "Installation verification failed"
        print_info "tdk command not found in PATH"
        print_info "You may need to restart your terminal or run:"
        echo "  export PATH=\"${HOME}/.bun/bin:\${PATH}\""
        exit 1
    fi
}

# Main installation flow
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║               🚀 TDK CLI Installer                         ║"
    echo "║          Tilt Development Kit - Install Script            ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    setup_directories
    clone_repository
    install_and_link
    setup_path
    verify_installation
}

# Run main function
main "$@"
