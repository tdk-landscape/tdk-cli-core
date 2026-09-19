# Makefile
# Common development tasks

.PHONY: help test-tilt-engine test test-coverage lint video video-build video-test video-validate video-generate

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Testing targets
test-tilt-engine: ## Run tilt-engine test suite
	@echo "🧪 Running tilt-engine tests..."
	pytest tests/tilt-engine/ -v --tb=short

test-tilt-engine-coverage: ## Run tilt-engine tests with coverage report
	@echo "🧪 Running tilt-engine tests with coverage..."
	pytest tests/tilt-engine/ -v --cov=tests/tilt-engine --cov-report=term-missing --cov-report=html

test: ## Run all tests
	@echo "🧪 Running all tests..."
	pytest tests/ -v --tb=short

test-coverage: ## Run all tests with coverage
	@echo "🧪 Running all tests with coverage..."
	pytest tests/ -v --cov --cov-report=term-missing --cov-report=html

# Test categories
test-snapshot: ## Run snapshot tests only
	pytest tests/tilt-engine/test_snapshot_*.py -v -m snapshot

test-daemon: ## Run daemon tests only
	pytest tests/tilt-engine/test_daemon_*.py -v -m daemon

test-health: ## Run health check tests only
	pytest tests/tilt-engine/test_health_*.py -v -m health

test-ide: ## Run IDE component tests only
	pytest tests/tilt-engine/test_*.py -v -m ide

test-safety: ## Run safety guard tests only
	pytest tests/tilt-engine/test_*prune*.py tests/tilt-engine/test_*alias*.py -v -m safety

test-cache: ## Run registry cache tests only
	pytest tests/tilt-engine/test_cache_*.py -v -m cache

# Fast tests (for pre-commit)
test-fast: ## Run fast unit tests only (no external deps)
	@echo "⚡ Running fast tests..."
	pytest -m fast --no-cov -q

test-generator: ## Run generator bug tests only
	@echo "🔧 Running generator tests..."
	pytest -m generator -v --no-cov

# Pre-commit hooks
pre-commit-install: ## Install pre-commit hooks
	@echo "🔧 Installing pre-commit hooks..."
	pip install pre-commit
	pre-commit install

pre-commit-run: ## Run pre-commit hooks on all files
	@echo "🔍 Running pre-commit hooks..."
	pre-commit run --all-files

pre-commit-fast: ## Run only fast tests (pre-commit style)
	@echo "⚡ Running fast pre-commit tests..."
	pytest -m fast --no-cov -q

# Video Generator targets
video: ## Show video generator help
	@cd video-generator && swift run tdk-video help

video-build: ## Build the video generator
	@echo "🔨 Building video generator..."
	cd video-generator && swift build

video-test: ## Run video generator tests
	@echo "🧪 Running video generator tests..."
	cd video-generator && swift test

video-validate: ## Validate video generator system setup
	@echo "🔍 Validating video generator setup..."
	cd video-generator && swift run tdk-video validate

video-generate: ## Generate the TDK CLI tutorial video (requires FFmpeg)
	@echo "🎬 Generating TDK CLI tutorial video..."
	@echo "   This will create TDK_Tutorial_1440p.mp4 (20 min, 2K)"
	cd video-generator && swift run tdk-video generate

video-generate-quick: ## Generate 1080p test video (faster)
	@echo "🎬 Generating 1080p test video..."
	cd video-generator && swift run tdk-video generate -o TDK_Tutorial_Test_1080p.mp4
