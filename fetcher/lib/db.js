const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

function loadEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const i = trimmed.indexOf('=');
    env[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim();
  }
  return env;
}

const backendEnv = loadEnv(path.join(__dirname, '..', '..', 'backend', '.env'));
const localEnv = loadEnv(path.join(__dirname, '..', '.env'));
const env = { ...backendEnv, ...localEnv };

function resolveCaPath() {
  const ca = env.DB_SSL_CA || 'certs/ca.pem';
  if (path.isAbsolute(ca)) return ca;
  return path.join(__dirname, '..', '..', 'backend', ca);
}

async function createPool() {
  const caPath = resolveCaPath();
  const config = {
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    namedPlaceholders: true,
  };

  if (caPath && fs.existsSync(caPath)) {
    config.ssl = { ca: fs.readFileSync(caPath) };
  }

  return mysql.createPool(config);
}

module.exports = { createPool, env, loadEnv };
