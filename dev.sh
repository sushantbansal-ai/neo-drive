#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
WEB_DIR="$ROOT_DIR/web"
BACKEND_ENV="$BACKEND_DIR/.env"
WEB_ENV="$WEB_DIR/.env"

APP_NAME="neo-drive"
DB_CONTAINER="${DB_CONTAINER:-neo-drive-postgres}"
DB_IMAGE="${DB_IMAGE:-postgres:16-alpine}"
DB_NAME="${DB_NAME:-neo_drive_db}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_PORT="${DB_PORT:-5432}"
BACKEND_PORT="${PORT:-3000}"
WEB_PORT="${WEB_PORT:-5173}"
BACKEND_URL="http://localhost:${BACKEND_PORT}"
WEB_URL="http://localhost:${WEB_PORT}"
DEFAULT_DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}"

AUTO_INSTALL="${AUTO_INSTALL:-1}"
OPEN_BROWSER="${OPEN_BROWSER:-1}"
RUN_TESTS="${RUN_TESTS:-0}"
RUN_SEED="${RUN_SEED:-1}"
RUN_MIGRATE_DEV="${RUN_MIGRATE_DEV:-0}"
USE_DOCKER_POSTGRES="${USE_DOCKER_POSTGRES:-1}"

BACKEND_LOG="${BACKEND_LOG:-/tmp/neo-drive-backend.log}"
WEB_LOG="${WEB_LOG:-/tmp/neo-drive-web.log}"

info() { printf "[INFO] %s\n" "$*"; }
warn() { printf "[WARN] %s\n" "$*"; }
err() { printf "[ERROR] %s\n" "$*" >&2; }
die() { err "$*"; exit 1; }
command_exists() { command -v "$1" >/dev/null 2>&1; }

detect_os() {
  case "$(uname -s 2>/dev/null || printf unknown)" in
    Darwin*) printf "macos" ;;
    Linux*)
      if grep -qi microsoft /proc/version 2>/dev/null; then
        printf "wsl"
      else
        printf "linux"
      fi
      ;;
    MINGW*|MSYS*|CYGWIN*) printf "windows" ;;
    *) printf "unknown" ;;
  esac
}

OS="$(detect_os)"

run_installer() {
  if [ "$AUTO_INSTALL" != "1" ]; then
    warn "AUTO_INSTALL=0; skipping installer: $*"
    return 1
  fi

  info "Running installer: $*"
  "$@"
}

install_homebrew() {
  command_exists brew && return 0
  [ "$OS" = "macos" ] || return 1
  command_exists curl || die "curl is required to install Homebrew."
  run_installer /bin/bash -c "curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh | bash"
}

install_node_and_npm() {
  if command_exists node && command_exists npm; then
    info "Node $(node --version) and npm $(npm --version) are installed"
    return 0
  fi

  info "Node.js or npm is missing; attempting OS-specific installation"
  case "$OS" in
    macos)
      install_homebrew
      run_installer brew install node
      ;;
    linux|wsl)
      if command_exists curl; then
        export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
        if [ ! -s "$NVM_DIR/nvm.sh" ]; then
          run_installer bash -c "curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash"
        fi
        # shellcheck disable=SC1090
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
        command_exists nvm && run_installer nvm install --lts
      fi
      if ! command_exists node || ! command_exists npm; then
        if command_exists apt-get; then
          run_installer sudo apt-get update
          run_installer sudo apt-get install -y nodejs npm
        elif command_exists dnf; then
          run_installer sudo dnf install -y nodejs npm
        elif command_exists yum; then
          run_installer sudo yum install -y nodejs npm
        elif command_exists pacman; then
          run_installer sudo pacman -Sy --noconfirm nodejs npm
        else
          die "Install Node.js LTS and npm, then rerun this script."
        fi
      fi
      ;;
    windows)
      if command_exists winget; then
        run_installer winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
      elif command_exists choco; then
        run_installer choco install nodejs-lts -y
      else
        die "Install Node.js LTS from nodejs.org, then rerun this script."
      fi
      ;;
    *)
      die "Unsupported OS for automatic Node.js installation. Install Node.js LTS and npm manually."
      ;;
  esac

  command_exists node && command_exists npm || die "Node.js/npm installation did not complete."
  info "Node $(node --version) and npm $(npm --version) are ready"
}

install_docker() {
  command_exists docker && return 0

  info "Docker is missing; attempting OS-specific installation"
  case "$OS" in
    macos)
      install_homebrew
      run_installer brew install --cask docker
      warn "Open Docker Desktop once installation finishes, then rerun this script if the daemon is not running."
      ;;
    linux|wsl)
      if command_exists curl; then
        run_installer sh -c "curl -fsSL https://get.docker.com | sh"
      elif command_exists apt-get; then
        run_installer sudo apt-get update
        run_installer sudo apt-get install -y docker.io
      else
        warn "Install Docker manually, or set USE_DOCKER_POSTGRES=0 to use a native Postgres server."
      fi
      ;;
    windows)
      if command_exists winget; then
        run_installer winget install --id Docker.DockerDesktop -e --accept-source-agreements --accept-package-agreements
      elif command_exists choco; then
        run_installer choco install docker-desktop -y
      else
        warn "Install Docker Desktop manually, or set USE_DOCKER_POSTGRES=0 to use a native Postgres server."
      fi
      ;;
    *)
      warn "Unsupported OS for automatic Docker installation."
      ;;
  esac
}

docker_is_running() {
  command_exists docker && docker info >/dev/null 2>&1
}

install_postgres_native() {
  if command_exists postgres || command_exists psql || command_exists pg_isready; then
    return 0
  fi

  info "Postgres tooling is missing; attempting OS-specific installation"
  case "$OS" in
    macos)
      install_homebrew
      run_installer brew install postgresql@16
      run_installer brew services start postgresql@16 || warn "Could not start Postgres via brew services."
      ;;
    linux|wsl)
      if command_exists apt-get; then
        run_installer sudo apt-get update
        run_installer sudo apt-get install -y postgresql postgresql-contrib
      elif command_exists dnf; then
        run_installer sudo dnf install -y postgresql-server postgresql-contrib
      elif command_exists yum; then
        run_installer sudo yum install -y postgresql-server postgresql-contrib
      elif command_exists pacman; then
        run_installer sudo pacman -Sy --noconfirm postgresql
      else
        warn "Install Postgres manually, or enable Docker Postgres."
      fi
      ;;
    windows)
      if command_exists winget; then
        run_installer winget install --id PostgreSQL.PostgreSQL -e --accept-source-agreements --accept-package-agreements
      elif command_exists choco; then
        run_installer choco install postgresql -y
      else
        warn "Install Postgres manually, or enable Docker Postgres."
      fi
      ;;
    *)
      warn "Unsupported OS for automatic Postgres installation."
      ;;
  esac
}

ensure_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"

  if ! grep -qE "^${key}=" "$file" 2>/dev/null; then
    printf "%s=%s\n" "$key" "$value" >> "$file"
    info "Added ${key} to ${file#$ROOT_DIR/}"
  fi
}

set_env_value() {
  local file="$1"
  local key="$2"
  local value="$3"
  local tmp_file="${file}.tmp"

  awk -v key="$key" -v value="$value" '
    BEGIN { found = 0 }
    $0 ~ "^" key "=" {
      print key "=" value
      found = 1
      next
    }
    { print }
    END {
      if (found == 0) {
        print key "=" value
      }
    }
  ' "$file" > "$tmp_file"
  mv "$tmp_file" "$file"
}

ensure_env_files() {
  if [ ! -f "$BACKEND_ENV" ]; then
    info "Creating backend/.env for local development"
    {
      printf "# Local development environment. Do not use these values in production.\n\n"
      printf "PORT=%s\n" "$BACKEND_PORT"
      printf "NODE_ENV=development\n"
      printf "DATABASE_URL=%s\n" "$DEFAULT_DATABASE_URL"
      printf "LOG_LEVEL=debug\n"
      printf "BOOKING_HORIZON_DAYS=14\n"
      printf "MAX_BOOKING_DURATION_MINS=360\n"
    } > "$BACKEND_ENV"
  fi

  ensure_env_value "$BACKEND_ENV" "PORT" "$BACKEND_PORT"
  ensure_env_value "$BACKEND_ENV" "NODE_ENV" "development"
  ensure_env_value "$BACKEND_ENV" "DATABASE_URL" "$DEFAULT_DATABASE_URL"
  ensure_env_value "$BACKEND_ENV" "LOG_LEVEL" "debug"
  ensure_env_value "$BACKEND_ENV" "BOOKING_HORIZON_DAYS" "14"
  ensure_env_value "$BACKEND_ENV" "MAX_BOOKING_DURATION_MINS" "360"

  if grep -q "dbuser:dbpassword" "$BACKEND_ENV"; then
    warn "Replacing placeholder DATABASE_URL credentials in backend/.env"
    set_env_value "$BACKEND_ENV" "DATABASE_URL" "$DEFAULT_DATABASE_URL"
  fi

  # shellcheck disable=SC1090
  set -a
  source "$BACKEND_ENV"
  set +a
  BACKEND_PORT="${PORT:-$BACKEND_PORT}"
  BACKEND_URL="http://localhost:${BACKEND_PORT}"

  if [ ! -f "$WEB_ENV" ]; then
    info "Creating web/.env for local development"
    printf "VITE_API_URL=%s\n" "$BACKEND_URL" > "$WEB_ENV"
  fi
  ensure_env_value "$WEB_ENV" "VITE_API_URL" "$BACKEND_URL"

  local current_api_url
  current_api_url="$(grep -E "^VITE_API_URL=" "$WEB_ENV" | tail -n 1 | cut -d= -f2- || true)"
  if [ "$current_api_url" != "$BACKEND_URL" ] && printf "%s" "$current_api_url" | grep -qE "^http://localhost:[0-9]+/?$"; then
    warn "Updating web/.env VITE_API_URL to match backend port"
    set_env_value "$WEB_ENV" "VITE_API_URL" "$BACKEND_URL"
  fi
}

npm_install_in() {
  local dir="$1"
  local label="$2"

  [ -f "$dir/package.json" ] || die "Missing ${label} package.json at ${dir}"
  info "Installing ${label} npm dependencies"
  (
    cd "$dir"
    if [ -f package-lock.json ]; then
      npm ci
    else
      npm install
    fi
  )
}

url_is_ready() {
  node - "$1" <<'NODE'
const http = require('http');
const https = require('https');

const target = process.argv[2];
const client = target.startsWith('https:') ? https : http;
const request = client.get(target, { timeout: 1500 }, (response) => {
  response.resume();
  process.exit(response.statusCode >= 200 && response.statusCode < 500 ? 0 : 1);
});

request.on('timeout', () => {
  request.destroy();
  process.exit(1);
});
request.on('error', () => process.exit(1));
NODE
}

wait_for_url() {
  local url="$1"
  local label="$2"
  local timeout="${3:-60}"
  local waited=0

  info "Waiting up to ${timeout}s for ${label}: ${url}"
  until url_is_ready "$url"; do
    sleep 1
    waited=$((waited + 1))
    if [ "$waited" -ge "$timeout" ]; then
      return 1
    fi
  done
  return 0
}

start_postgres_container() {
  install_docker
  docker_is_running || return 1

  if docker ps --filter "name=^/${DB_CONTAINER}$" --format "{{.Names}}" | grep -qx "$DB_CONTAINER"; then
    info "Postgres container ${DB_CONTAINER} is already running"
    return 0
  fi

  if docker ps -a --filter "name=^/${DB_CONTAINER}$" --format "{{.Names}}" | grep -qx "$DB_CONTAINER"; then
    info "Starting existing Postgres container ${DB_CONTAINER}"
    docker start "$DB_CONTAINER" >/dev/null
  else
    info "Creating Postgres container ${DB_CONTAINER} on localhost:${DB_PORT}"
    docker run -d \
      --name "$DB_CONTAINER" \
      -e POSTGRES_USER="$DB_USER" \
      -e POSTGRES_PASSWORD="$DB_PASSWORD" \
      -e POSTGRES_DB="$DB_NAME" \
      -p "${DB_PORT}:5432" \
      "$DB_IMAGE" >/dev/null
  fi
}

wait_for_postgres() {
  local timeout="${1:-60}"
  local waited=0

  info "Waiting up to ${timeout}s for Postgres"
  while [ "$waited" -lt "$timeout" ]; do
    if command_exists pg_isready && pg_isready -h localhost -p "$DB_PORT" >/dev/null 2>&1; then
      info "Postgres is accepting connections on localhost:${DB_PORT}"
      return 0
    fi
    if docker_is_running && docker ps --filter "name=^/${DB_CONTAINER}$" --format "{{.Names}}" | grep -qx "$DB_CONTAINER"; then
      if docker exec "$DB_CONTAINER" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
        info "Postgres container is accepting connections"
        return 0
      fi
    fi
    sleep 1
    waited=$((waited + 1))
  done

  return 1
}

ensure_postgres() {
  if wait_for_postgres 3; then
    return 0
  fi

  if [ "$USE_DOCKER_POSTGRES" = "1" ]; then
    if start_postgres_container && wait_for_postgres 90; then
      return 0
    fi
    warn "Docker Postgres is not ready. Falling back to native Postgres checks."
  fi

  install_postgres_native
  case "$OS" in
    macos)
      command_exists brew && brew services start postgresql@16 >/dev/null 2>&1 || true
      ;;
    linux|wsl)
      command_exists systemctl && sudo systemctl start postgresql >/dev/null 2>&1 || true
      command_exists service && sudo service postgresql start >/dev/null 2>&1 || true
      ;;
  esac

  wait_for_postgres 60 || die "Postgres is not reachable. Start Postgres on localhost:${DB_PORT} or rerun with USE_DOCKER_POSTGRES=1."
}

ensure_database_exists() {
  info "Ensuring configured Postgres database exists"
  (
    cd "$BACKEND_DIR"
    set -a
    # shellcheck disable=SC1091
    source "$BACKEND_ENV"
    set +a
    node <<'NODE'
const { Client } = require('pg');

function quoteIdentifier(value) {
  return '"' + value.replace(/"/g, '""') + '"';
}

async function databaseExists(connectionString, databaseName) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const result = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [databaseName],
    );
    return result.rowCount > 0;
  } finally {
    await client.end();
  }
}

async function createDatabase(connectionString, databaseName) {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
  } finally {
    await client.end();
  }
}

async function canConnect(connectionString) {
  const client = new Client({ connectionString });
  await client.connect();
  await client.end();
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  const targetUrl = new URL(databaseUrl);
  const databaseName = decodeURIComponent(targetUrl.pathname.replace(/^\//, ''));
  if (!databaseName) {
    throw new Error('DATABASE_URL must include a database name.');
  }

  try {
    await canConnect(databaseUrl);
    console.log(`Database ${databaseName} is reachable.`);
    return;
  } catch (error) {
    if (error.code !== '3D000') {
      throw error;
    }
  }

  const maintenanceUrls = ['postgres', 'template1'].map((name) => {
    const url = new URL(databaseUrl);
    url.pathname = `/${name}`;
    return url.toString();
  });

  let lastError;
  for (const maintenanceUrl of maintenanceUrls) {
    try {
      if (await databaseExists(maintenanceUrl, databaseName)) {
        console.log(`Database ${databaseName} already exists.`);
        return;
      }
      await createDatabase(maintenanceUrl, databaseName);
      console.log(`Created database ${databaseName}.`);
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
NODE
  )
}

run_prisma_setup() {
  info "Generating Prisma client and applying migrations"
  (
    cd "$BACKEND_DIR"
    set -a
    # shellcheck disable=SC1091
    source "$BACKEND_ENV"
    set +a
    npm run prisma:generate
    if [ "$RUN_MIGRATE_DEV" = "1" ]; then
      npm run prisma:migrate -- --name dev_bootstrap
    else
      npm run prisma:migrate:deploy
    fi
    if [ "$RUN_SEED" = "1" ]; then
      npm run prisma:seed
    fi
  )
}

port_has_listener() {
  local port="$1"
  if command_exists lsof; then
    lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
  elif command_exists netstat; then
    netstat -an 2>/dev/null | grep -E "[.:]${port}[[:space:]].*LISTEN" >/dev/null 2>&1
  else
    return 1
  fi
}

start_backend() {
  if wait_for_url "${BACKEND_URL}/health" "backend" 2; then
    info "Backend is already running at ${BACKEND_URL}"
    return 0
  fi
  if port_has_listener "$BACKEND_PORT"; then
    warn "Port ${BACKEND_PORT} is already in use, but ${BACKEND_URL}/health is not responding."
    warn "Check the existing process or change PORT in backend/.env."
    return 1
  fi

  info "Starting backend dev server"
  (
    cd "$BACKEND_DIR"
    set -a
    # shellcheck disable=SC1091
    source "$BACKEND_ENV"
    set +a
    nohup npm run start:dev > "$BACKEND_LOG" 2>&1 &
    printf "%s" "$!" > /tmp/neo-drive-backend.pid
  )
  wait_for_url "${BACKEND_URL}/health" "backend" 90 || {
    warn "Backend did not become ready. Logs: ${BACKEND_LOG}"
    return 1
  }
  info "Backend is running at ${BACKEND_URL}"
}

start_web() {
  if wait_for_url "$WEB_URL" "web" 2; then
    info "Web app is already running at ${WEB_URL}"
    return 0
  fi
  if port_has_listener "$WEB_PORT"; then
    warn "Port ${WEB_PORT} is already in use, but ${WEB_URL} is not responding."
    warn "Set WEB_PORT to another value and rerun."
    return 1
  fi

  info "Starting web dev server"
  (
    cd "$WEB_DIR"
    nohup npm run dev -- --host 0.0.0.0 --port "$WEB_PORT" --strictPort > "$WEB_LOG" 2>&1 &
    printf "%s" "$!" > /tmp/neo-drive-web.pid
  )
  wait_for_url "$WEB_URL" "web" 90 || {
    warn "Web app did not become ready. Logs: ${WEB_LOG}"
    return 1
  }
  info "Web app is running at ${WEB_URL}"
}

open_browser() {
  [ "$OPEN_BROWSER" = "1" ] || {
    info "OPEN_BROWSER=0; skipping browser launch"
    return 0
  }

  info "Opening browser at ${WEB_URL}"
  case "$OS" in
    macos) open "$WEB_URL" >/dev/null 2>&1 || warn "Could not open browser automatically." ;;
    linux|wsl)
      if command_exists xdg-open; then
        xdg-open "$WEB_URL" >/dev/null 2>&1 || warn "Could not open browser automatically."
      elif command_exists powershell.exe; then
        powershell.exe Start-Process "$WEB_URL" >/dev/null 2>&1 || warn "Could not open browser automatically."
      else
        warn "Open ${WEB_URL} in your browser."
      fi
      ;;
    windows)
      if command_exists powershell.exe; then
        powershell.exe Start-Process "$WEB_URL" >/dev/null 2>&1 || warn "Could not open browser automatically."
      else
        cmd.exe /c start "" "$WEB_URL" >/dev/null 2>&1 || warn "Could not open browser automatically."
      fi
      ;;
    *) warn "Open ${WEB_URL} in your browser." ;;
  esac
}

run_tests() {
  [ "$RUN_TESTS" = "1" ] || return 0
  info "Running backend tests"
  (cd "$BACKEND_DIR" && npm run test)
  info "Running web build"
  (cd "$WEB_DIR" && npm run build)
}

main() {
  info "Bootstrapping ${APP_NAME} development environment"
  info "Detected OS: ${OS}"

  install_node_and_npm
  ensure_env_files
  npm_install_in "$BACKEND_DIR" "backend"
  npm_install_in "$WEB_DIR" "web"
  ensure_postgres
  ensure_database_exists
  run_prisma_setup
  run_tests
  start_backend
  start_web
  open_browser

  info "Ready for testing: ${WEB_URL}"
  info "Backend API: ${BACKEND_URL}"
  info "Logs: ${BACKEND_LOG} and ${WEB_LOG}"
}

main "$@"
